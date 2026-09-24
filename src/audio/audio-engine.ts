/**
 * Audio Engine — Orchestrator
 *
 * Central module that ties together:
 *  - Microphone capture (getUserMedia)
 *  - YIN AudioWorklet pitch tracker
 *  - Noise-floor calibration
 *  - Mantra playback (decoded AudioBuffers)
 *
 * Enforces the half-duplex constraint: never play the mantra while
 * the mic is actively analysing.
 */

import { calibrateNoiseFloor, type CalibrationResult } from './calibration';
import type { PitchFrame } from './scale-detector';

// ─── Types ───────────────────────────────────────────────────────────────────
export type AudioEngineState =
  | 'idle'
  | 'requesting-mic'
  | 'calibrating'
  | 'listening'    // mic is analysing (YIN running)
  | 'playing'      // mantra is playing (mic paused)
  | 'error';

export interface AudioEngineEvents {
  /** Fired when the engine state changes */
  onStateChange?: (state: AudioEngineState) => void;
  /** Fired for each pitch frame from the YIN worklet */
  onPitchFrame?: (frame: PitchFrame) => void;
  /** Fired when calibration completes */
  onCalibrationDone?: (result: CalibrationResult) => void;
  /** Fired on any error */
  onError?: (error: Error) => void;
  /** Fired when mantra playback ends (loop or stopped) */
  onPlaybackStopped?: () => void;
}

export interface MicConstraints {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  channelCount: number;
  deviceId?: string;
}

const DEFAULT_MIC_CONSTRAINTS: MicConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  channelCount: 1,
};

// ─── Audio Engine Class ──────────────────────────────────────────────────────
export class AudioEngine {
  private state: AudioEngineState = 'idle';
  private events: AudioEngineEvents;
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private yinNode: AudioWorkletNode | null = null;
  private mantraBuffer: AudioBuffer | null = null;
  private mantraSourceNode: AudioBufferSourceNode | null = null;
  private noiseGate = 0.001;
  private pitchFrames: PitchFrame[] = [];

  constructor(events: AudioEngineEvents = {}) {
    this.events = events;
  }

  // ── Public Getters ──────────────────────────────────────────────────────

  getState(): AudioEngineState {
    return this.state;
  }

  getPitchFrames(): PitchFrame[] {
    return [...this.pitchFrames];
  }

  getSampleRate(): number {
    return this.audioContext?.sampleRate ?? 48000;
  }

  getStreamSettings(): MediaTrackSettings | null {
    const track = this.stream?.getAudioTracks()[0];
    return track?.getSettings() ?? null;
  }

  // ── State Management ────────────────────────────────────────────────────

  private setState(newState: AudioEngineState) {
    this.state = newState;
    this.events.onStateChange?.(newState);
  }

  // ── Microphone ──────────────────────────────────────────────────────────

  /**
   * Request microphone access and set up the AudioContext + YIN worklet.
   */
  async requestMic(
    constraints: Partial<MicConstraints> = {}
  ): Promise<void> {
    this.setState('requesting-mic');

    try {
      const micConstraints = { ...DEFAULT_MIC_CONSTRAINTS, ...constraints };
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: micConstraints.echoCancellation,
          noiseSuppression: micConstraints.noiseSuppression,
          autoGainControl: micConstraints.autoGainControl,
          channelCount: micConstraints.channelCount,
          ...(micConstraints.deviceId
            ? { deviceId: { exact: micConstraints.deviceId } }
            : {}),
        },
      });

      // Log whether constraints were honored
      const settings = this.getStreamSettings();
      if (settings) {
        console.info('[AudioEngine] Mic settings:', {
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
          autoGainControl: settings.autoGainControl,
          sampleRate: settings.sampleRate,
          channelCount: settings.channelCount,
        });
      }

      // Create AudioContext (must be triggered by user gesture on iOS)
      this.audioContext = new AudioContext();

      // Load the YIN worklet
      await this.audioContext.audioWorklet.addModule(
        new URL('./worklets/yin-processor.ts', import.meta.url).href
      );

      this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);

      this.setState('idle');
    } catch (err) {
      this.setState('error');
      this.events.onError?.(
        err instanceof Error ? err : new Error('Microphone access denied')
      );
    }
  }

  // ── Calibration ─────────────────────────────────────────────────────────

  /**
   * Run noise-floor calibration (3s of silence).
   */
  async calibrate(
    onProgress?: (progress: number) => void
  ): Promise<CalibrationResult | null> {
    if (!this.stream) {
      this.events.onError?.(new Error('Mic not initialized. Call requestMic() first.'));
      return null;
    }

    this.setState('calibrating');

    try {
      const result = await calibrateNoiseFloor(
        this.stream,
        {},
        onProgress
      );

      this.noiseGate = result.noiseGate;

      // If YIN worklet already exists, update its noise gate
      if (this.yinNode) {
        this.yinNode.port.postMessage({
          type: 'setNoiseGate',
          value: this.noiseGate,
        });
      }

      this.setState('idle');
      this.events.onCalibrationDone?.(result);
      return result;
    } catch (err) {
      this.setState('error');
      this.events.onError?.(
        err instanceof Error ? err : new Error('Calibration failed')
      );
      return null;
    }
  }

  // ── Pitch Listening (YIN) ───────────────────────────────────────────────

  /**
   * Start listening: connect the mic to the YIN worklet and begin
   * receiving pitch frames.
   */
  startListening(): void {
    if (!this.audioContext || !this.sourceNode) {
      this.events.onError?.(new Error('Mic not initialized.'));
      return;
    }

    // Enforce half-duplex: stop playback before listening
    this.stopPlayback();

    // Clear previous frames
    this.pitchFrames = [];

    // Create YIN worklet node
    this.yinNode = new AudioWorkletNode(this.audioContext, 'yin-processor', {
      processorOptions: {
        windowSize: 2048,
        threshold: 0.15,
        noiseGate: this.noiseGate,
      },
    });

    // Listen for pitch data
    this.yinNode.port.onmessage = (event: MessageEvent<PitchFrame>) => {
      const frame = event.data;
      this.pitchFrames.push(frame);
      this.events.onPitchFrame?.(frame);
    };

    this.sourceNode.connect(this.yinNode);
    // Connect to destination to keep the pipeline alive (silent output)
    this.yinNode.connect(this.audioContext.destination);

    this.setState('listening');
  }

  /**
   * Stop listening: disconnect the YIN worklet.
   */
  stopListening(): void {
    if (this.yinNode && this.sourceNode) {
      try {
        this.sourceNode.disconnect(this.yinNode);
        this.yinNode.disconnect();
      } catch {
        // Ignore if already disconnected
      }
      this.yinNode = null;
    }

    if (this.state === 'listening') {
      this.setState('idle');
    }
  }

  // ── Mantra Playback ─────────────────────────────────────────────────────

  /**
   * Load a mantra audio file into an AudioBuffer for playback.
   */
  async loadMantra(url: string): Promise<void> {
    if (!this.audioContext) {
      this.events.onError?.(new Error('AudioContext not initialized.'));
      return;
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      this.mantraBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    } catch (err) {
      this.events.onError?.(
        err instanceof Error ? err : new Error(`Failed to load mantra: ${url}`)
      );
    }
  }

  /**
   * Play the loaded mantra (loops until stopped).
   * Enforces half-duplex: stops mic listening before playing.
   */
  playMantra(): void {
    if (!this.audioContext || !this.mantraBuffer) {
      this.events.onError?.(new Error('No mantra loaded.'));
      return;
    }

    // Enforce half-duplex: stop listening before playing
    this.stopListening();

    this.mantraSourceNode = this.audioContext.createBufferSource();
    this.mantraSourceNode.buffer = this.mantraBuffer;
    this.mantraSourceNode.loop = true;
    this.mantraSourceNode.connect(this.audioContext.destination);

    this.mantraSourceNode.onended = () => {
      this.events.onPlaybackStopped?.();
      if (this.state === 'playing') {
        this.setState('idle');
      }
    };

    this.mantraSourceNode.start();
    this.setState('playing');
  }

  /**
   * Stop mantra playback.
   */
  stopPlayback(): void {
    if (this.mantraSourceNode) {
      try {
        this.mantraSourceNode.stop();
        this.mantraSourceNode.disconnect();
      } catch {
        // Already stopped
      }
      this.mantraSourceNode = null;
    }

    if (this.state === 'playing') {
      this.setState('idle');
    }
  }

  // ── Cleanup ─────────────────────────────────────────────────────────────

  /**
   * Fully tear down the audio engine: stop mic, worklet, playback, close context.
   */
  async destroy(): Promise<void> {
    this.stopListening();
    this.stopPlayback();

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.sourceNode = null;
    this.pitchFrames = [];
    this.setState('idle');
  }
}
