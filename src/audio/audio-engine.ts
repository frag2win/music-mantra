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
import yinProcessorUrl from './worklets/yin-processor.ts?worker&url';
import type { PitchFrame } from './scale-detector';
import { generateHarmonicMantraBuffer, type SynthMantraOptions } from './mantra-synth';

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
  /** Fired on platform/device warnings e.g. Bluetooth narrowband */
  onWarning?: (warning: string) => void;
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

        // Platform Hardening: Detect narrowband Bluetooth headset (<16 kHz)
        if (settings.sampleRate && settings.sampleRate < 16000) {
          this.events.onWarning?.(
            'Narrowband audio input detected (<16 kHz). Bluetooth headset may reduce pitch accuracy. A wired or built-in microphone is recommended.'
          );
        }
      }

      // Create AudioContext (must be triggered by user gesture on iOS)
      this.audioContext = new AudioContext();

      // Load the YIN worklet (using Vite worker URL import to ensure TS compilation)
      await this.audioContext.audioWorklet.addModule(yinProcessorUrl);

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
   * Ensure AudioContext is resumed (iOS Safari requirement on user gesture)
   */
  async resumeContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Load a mantra audio file into an AudioBuffer for playback.
   * If recorded audio file is missing or fails to fetch/decode, gracefully falls back
   * to generating an authentic harmonic Tanpura + Swara drone buffer.
   */
  async loadMantra(url: string, fallbackOptions?: SynthMantraOptions): Promise<void> {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      } else {
        this.events.onError?.(new Error('AudioContext is not supported by this browser.'));
        return;
      }
    }

    await this.resumeContext();

    // Prepare candidate URLs (trying .mp3, .mpeg, and original url)
    const candidates: string[] = [url];
    if (url.endsWith('.m4a')) {
      candidates.unshift(url.replace(/\.m4a$/, '.mpeg'));
      candidates.unshift(url.replace(/\.m4a$/, '.mp3'));
    } else if (url.endsWith('.mpeg')) {
      candidates.unshift(url.replace(/\.mpeg$/, '.mp3'));
    }

    let decoded: AudioBuffer | null = null;
    let lastError: Error | null = null;

    for (const candidate of candidates) {
      try {
        const response = await fetch(candidate);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} loading ${candidate}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        
        if (arrayBuffer instanceof ArrayBuffer && arrayBuffer.byteLength > 0) {
          try {
            decoded = await this.audioContext.decodeAudioData(arrayBuffer);
            if (decoded) {
              console.info(`[AudioEngine] Successfully loaded and decoded audio: ${candidate} (${decoded.duration.toFixed(2)}s)`);
              break;
            }
          } catch (decodeErr) {
            const msg = decodeErr instanceof Error ? decodeErr.message : String(decodeErr);
            throw new Error(`Decoding failed: ${msg}. Ensure file is a valid MP3/WAV/M4A.`);
          }
        } else {
          throw new Error(`Empty or invalid audio buffer received from ${candidate}`);
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        console.warn(`[AudioEngine] Failed to load candidate ${candidate}: ${lastError.message}`);
      }
    }

    if (decoded) {
      this.mantraBuffer = decoded;
    } else {
      if (fallbackOptions) {
        console.warn(`[AudioEngine] Studio mantra file unavailable (${lastError?.message}), using harmonic Tanpura drone fallback.`);
        this.mantraBuffer = generateHarmonicMantraBuffer(this.audioContext, fallbackOptions);
      } else {
        this.events.onError?.(lastError || new Error(`Failed to load mantra from ${url}`));
      }
    }
  }

  /**
   * Play the loaded mantra (loops until stopped).
   * Enforces half-duplex: stops mic listening before playing.
   */
  playMantra(): void {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }

    if (!this.audioContext || !this.mantraBuffer) {
      this.events.onError?.(new Error('No mantra loaded.'));
      return;
    }

    // Enforce half-duplex: stop listening before playing
    this.stopListening();

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }

    // Stop existing playback node if still active
    this.stopPlayback();

    this.mantraSourceNode = this.audioContext.createBufferSource();
    this.mantraSourceNode.buffer = this.mantraBuffer;
    this.mantraSourceNode.loop = true;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(1.0, this.audioContext.currentTime);

    this.mantraSourceNode.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    this.mantraSourceNode.onended = () => {
      this.events.onPlaybackStopped?.();
      if (this.state === 'playing') {
        this.setState('idle');
      }
    };

    this.mantraSourceNode.start(0);
    this.setState('playing');
    console.info('[AudioEngine] Mantra playback started.');
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
