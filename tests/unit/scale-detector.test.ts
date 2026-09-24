/**
 * Unit Tests — Scale Detector (Krumhansl–Schmuckler)
 *
 * Tests the chroma histogram builder, pitch-class conversion,
 * and key detection algorithm against known synthetic inputs.
 */
import { describe, it, expect } from 'vitest';
import {
  frequencyToPitchClass,
  buildChromaHistogram,
  detectScale,
} from '../../src/audio/scale-detector';
import type { PitchFrame } from '../../src/audio/scale-detector';

// ─── Helper ──────────────────────────────────────────────────────────────────
function makeFrame(t: number, f0: number, conf = 0.95): PitchFrame {
  return { t, f0, conf };
}

/**
 * Generate frames simulating a major scale rooted on a given frequency.
 * Major scale intervals in semitones: 0, 2, 4, 5, 7, 9, 11
 */
function generateMajorScaleFrames(
  rootHz: number,
  framesPerNote = 50
): PitchFrame[] {
  const intervals = [0, 2, 4, 5, 7, 9, 11]; // major scale semitones
  const frames: PitchFrame[] = [];
  let t = 0;

  for (const interval of intervals) {
    const f0 = rootHz * Math.pow(2, interval / 12);
    for (let i = 0; i < framesPerNote; i++) {
      frames.push(makeFrame(t, f0));
      t += 0.01;
    }
  }

  // Add more tonic and dominant to reinforce the key
  for (let i = 0; i < framesPerNote * 2; i++) {
    frames.push(makeFrame(t, rootHz)); // tonic
    t += 0.01;
  }
  for (let i = 0; i < framesPerNote; i++) {
    frames.push(makeFrame(t, rootHz * Math.pow(2, 7 / 12))); // dominant
    t += 0.01;
  }

  return frames;
}

// ─── frequencyToPitchClass() ─────────────────────────────────────────────────
describe('frequencyToPitchClass', () => {
  it('maps A4 (440 Hz) to pitch class 9 (A)', () => {
    expect(frequencyToPitchClass(440)).toBe(9);
  });

  it('maps C4 (~261.63 Hz) to pitch class 0 (C)', () => {
    expect(frequencyToPitchClass(261.63)).toBe(0);
  });

  it('maps E4 (~329.63 Hz) to pitch class 4 (E)', () => {
    expect(frequencyToPitchClass(329.63)).toBe(4);
  });

  it('maps A3 (220 Hz) to pitch class 9 (A) — octave invariant', () => {
    expect(frequencyToPitchClass(220)).toBe(9);
  });

  it('maps A5 (880 Hz) to pitch class 9 (A) — octave invariant', () => {
    expect(frequencyToPitchClass(880)).toBe(9);
  });
});

// ─── buildChromaHistogram() ──────────────────────────────────────────────────
describe('buildChromaHistogram', () => {
  it('produces a 12-element array', () => {
    const frames = [makeFrame(0, 440)];
    const hist = buildChromaHistogram(frames);
    expect(hist).toHaveLength(12);
  });

  it('peaks at the correct pitch class for a single-note input', () => {
    // All frames at A4 → pitch class 9 should be strongest
    const frames = Array.from({ length: 100 }, (_, i) =>
      makeFrame(i * 0.01, 440)
    );
    const hist = buildChromaHistogram(frames);
    const maxIndex = hist.indexOf(Math.max(...hist));
    expect(maxIndex).toBe(9);
  });

  it('ignores unvoiced frames (f0 = 0)', () => {
    const frames = [
      makeFrame(0, 0),
      makeFrame(0.01, 0),
      makeFrame(0.02, 440),
    ];
    const hist = buildChromaHistogram(frames);
    // Only one frame contributes
    expect(hist[9]).toBeGreaterThan(0);
  });
});

// ─── detectScale() ───────────────────────────────────────────────────────────
describe('detectScale', () => {
  it('detects C major from C major scale frames', () => {
    const frames = generateMajorScaleFrames(261.63); // C4
    const result = detectScale(frames);
    expect(result.tonic).toBe('C');
    expect(result.mode).toBe('major');
    expect(result.confidence).toBeGreaterThan(0.6);
    expect(result.lowConfidence).toBe(false);
  });

  it('detects A major from A major scale frames', () => {
    const frames = generateMajorScaleFrames(440); // A4
    const result = detectScale(frames);
    expect(result.tonic).toBe('A');
    expect(result.mode).toBe('major');
    expect(result.confidence).toBeGreaterThan(0.6);
  });

  it('detects G major from G major scale frames', () => {
    const frames = generateMajorScaleFrames(392); // G4
    const result = detectScale(frames);
    expect(result.tonic).toBe('G');
    expect(result.mode).toBe('major');
  });

  it('returns low confidence for random noise-like input', () => {
    // All 12 pitch classes equally represented → no clear key
    const frames: PitchFrame[] = [];
    let t = 0;
    for (let pc = 0; pc < 12; pc++) {
      const f0 = 261.63 * Math.pow(2, pc / 12);
      for (let i = 0; i < 10; i++) {
        frames.push(makeFrame(t, f0));
        t += 0.01;
      }
    }
    const result = detectScale(frames);
    // With uniform input, correlation should be lower
    expect(result.confidence).toBeLessThan(0.9);
  });

  it('provides a runner-up key', () => {
    const frames = generateMajorScaleFrames(261.63);
    const result = detectScale(frames);
    expect(result.runnerUp).toBeDefined();
    expect(result.runnerUp.tonic).toBeDefined();
    expect(result.runnerUp.confidence).toBeLessThanOrEqual(result.confidence);
  });

  it('returns a valid saFrequency', () => {
    const frames = generateMajorScaleFrames(261.63);
    const result = detectScale(frames);
    expect(result.saFrequency).toBeGreaterThan(0);
    expect(result.saFrequency).toBeLessThan(5000);
  });

  it('returns a chromaHistogram with 12 elements', () => {
    const frames = generateMajorScaleFrames(440);
    const result = detectScale(frames);
    expect(result.chromaHistogram).toHaveLength(12);
  });
});
