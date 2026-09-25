/**
 * Unit Tests — YIN Pitch Tracker
 *
 * Mocks the AudioWorkletGlobalScope environment to test the YIN DSP algorithm
 * directly using synthetic sine waves and noise.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { centError } from '../../src/audio/accuracy';

// ─── Mocks for AudioWorkletGlobalScope ───────────────────────────────────────

const SAMPLE_RATE = 48000;
let YinProcessorClass: any = null;

// MessagePort mock
class MockMessagePort {
  onmessage: ((event: any) => void) | null = null;
  postMessage = vi.fn();
}

// AudioWorkletProcessor mock
class MockAudioWorkletProcessor {
  port = new MockMessagePort();
}

beforeAll(async () => {
  // Inject globals before importing the processor
  vi.stubGlobal('sampleRate', SAMPLE_RATE);
  vi.stubGlobal('AudioWorkletProcessor', MockAudioWorkletProcessor);
  vi.stubGlobal('registerProcessor', (name: string, processorCtor: any) => {
    if (name === 'yin-processor') {
      YinProcessorClass = processorCtor;
    }
  });

  // Dynamically import to ensure globals are evaluated first
  await import('../../src/audio/worklets/yin-processor');
});

afterAll(() => {
  vi.unstubAllGlobals();
});

// ─── Synthetic Audio Generators ──────────────────────────────────────────────

/**
 * Generates a pure sine wave array.
 */
function generateSineWave(freq: number, durationSec: number): Float32Array {
  const numSamples = Math.ceil(durationSec * SAMPLE_RATE);
  const buffer = new Float32Array(numSamples);
  const angularFreq = 2 * Math.PI * freq;
  for (let i = 0; i < numSamples; i++) {
    buffer[i] = Math.sin((angularFreq * i) / SAMPLE_RATE);
  }
  return buffer;
}

/**
 * Generates a sine wave with additive white noise.
 */
function generateNoisySineWave(freq: number, durationSec: number, snrDb: number): Float32Array {
  const pure = generateSineWave(freq, durationSec);
  const signalRms = Math.sqrt(0.5); // RMS of sine with amp 1 is 1/sqrt(2)
  const noiseRms = signalRms / Math.pow(10, snrDb / 20);
  
  let seed = 12345;
  const buffer = new Float32Array(pure.length);
  for (let i = 0; i < pure.length; i++) {
    // Deterministic pseudo-random noise
    let noise = 0;
    for (let j = 0; j < 6; j++) {
      seed = (seed * 9301 + 49297) % 233280;
      noise += (seed / 233280) * 2 - 1;
    }
    noise *= noiseRms / Math.sqrt(2); // scale variance
    buffer[i] = pure[i] + noise;
  }
  return buffer;
}

/**
 * Generates silence.
 */
function generateSilence(durationSec: number): Float32Array {
  return new Float32Array(Math.ceil(durationSec * SAMPLE_RATE));
}

// ─── Test Helper ─────────────────────────────────────────────────────────────

/**
 * Feeds a buffer into the YIN processor in 128-sample render quanta
 * and collects all emitted pitch frames.
 */
function runProcessor(buffer: Float32Array, processorInstance: any) {
  const quantumSize = 128;
  const frames: { t: number; f0: number; conf: number }[] = [];

  // Intercept postMessage
  processorInstance.port.postMessage.mockImplementation((frame: any) => {
    frames.push(frame);
  });

  for (let i = 0; i < buffer.length; i += quantumSize) {
    const chunk = buffer.subarray(i, i + quantumSize);
    if (chunk.length < quantumSize) {
      // Pad with zeros if necessary
      const padded = new Float32Array(quantumSize);
      padded.set(chunk);
      processorInstance.process([[padded]], [], {});
    } else {
      processorInstance.process([[chunk]], [], {});
    }
  }

  return frames;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('YIN Processor (AudioWorklet)', () => {
  it('detects a clean 440 Hz sine wave with < 5 cents error', () => {
    const processor = new YinProcessorClass();
    const buffer = generateSineWave(440, 1.0); // 1 second of A4
    const frames = runProcessor(buffer, processor);

    // Filter out initial frames before the buffer filled up completely
    // and wait for median filter to stabilize
    const stableFrames = frames.slice(5);

    expect(stableFrames.length).toBeGreaterThan(0);
    
    // Check F0 accuracy
    for (const frame of stableFrames) {
      const cents = Math.abs(centError(frame.f0, 440));
      expect(cents).toBeLessThan(5);
      expect(frame.conf).toBeGreaterThan(0.9);
    }
  });

  it('detects a 100 Hz sine wave with < 5 cents error', () => {
    const processor = new YinProcessorClass();
    const buffer = generateSineWave(100, 1.0);
    const frames = runProcessor(buffer, processor);
    
    const stableFrames = frames.slice(5);
    expect(stableFrames.length).toBeGreaterThan(0);
    
    for (const frame of stableFrames) {
      const cents = Math.abs(centError(frame.f0, 100));
      expect(cents).toBeLessThan(5);
    }
  });

  it('detects a 790 Hz sine wave with < 5 cents error', () => {
    const processor = new YinProcessorClass();
    const buffer = generateSineWave(790, 1.0);
    const frames = runProcessor(buffer, processor);
    
    const stableFrames = frames.slice(5);
    expect(stableFrames.length).toBeGreaterThan(0);
    
    for (const frame of stableFrames) {
      const cents = Math.abs(centError(frame.f0, 790));
      expect(cents).toBeLessThan(5);
    }
  });

  it('maintains < 15 cents error in noisy conditions (10 dB SNR)', () => {
    const processor = new YinProcessorClass();
    const buffer = generateNoisySineWave(440, 1.0, 10);
    const frames = runProcessor(buffer, processor);
    
    const stableFrames = frames.slice(5);
    expect(stableFrames.length).toBeGreaterThan(0);
    
    // In noisy conditions, we check the median/average error
    let totalCents = 0;
    for (const frame of stableFrames) {
      totalCents += Math.abs(centError(frame.f0, 440));
    }
    const avgCents = totalCents / stableFrames.length;
    
    expect(avgCents).toBeLessThan(15);
  });

  it('returns f0 = 0 (unvoiced) during absolute silence', () => {
    const processor = new YinProcessorClass();
    const buffer = generateSilence(1.0);
    const frames = runProcessor(buffer, processor);
    
    const stableFrames = frames.slice(5);
    expect(stableFrames.length).toBeGreaterThan(0);
    
    for (const frame of stableFrames) {
      expect(frame.f0).toBe(0);
      expect(frame.conf).toBe(0);
    }
  });

  it('honors the noise gate sent from the main thread', () => {
    const processor = new YinProcessorClass();
    
    // Send a noise gate update
    processor.port.onmessage?.({ data: { type: 'setNoiseGate', value: 0.1 } });
    
    // Generate a sine wave that is BELOW the noise gate (amplitude 0.05)
    const numSamples = SAMPLE_RATE;
    const buffer = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      buffer[i] = Math.sin((2 * Math.PI * 440 * i) / SAMPLE_RATE) * 0.05;
    }
    
    const frames = runProcessor(buffer, processor);
    const stableFrames = frames.slice(5);
    
    // Because the RMS is below 0.1, it should all be classified as unvoiced
    for (const frame of stableFrames) {
      expect(frame.f0).toBe(0);
    }
  });
});
