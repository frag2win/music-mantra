/**
 * Unit Tests — Accuracy Metric
 *
 * Tests the cent error formula, accuracy score, and evaluation gate logic.
 * These are pure math functions, no browser APIs needed.
 */
import { describe, it, expect } from 'vitest';
import {
  centError,
  centToAccuracy,
  frameAccuracy,
  getTargetFrequency,
  computeEvalAccuracy,
  evaluationGatePassed,
  CONDITION_RATIOS,
} from '../../src/audio/accuracy';
import type { PitchFrame } from '../../src/audio/scale-detector';

// ─── Helper ──────────────────────────────────────────────────────────────────
function makeFrame(t: number, f0: number, conf = 0.95): PitchFrame {
  return { t, f0, conf };
}

// ─── centError() ─────────────────────────────────────────────────────────────
describe('centError', () => {
  it('returns 0 cents when f0 exactly matches the target', () => {
    expect(centError(440, 440)).toBeCloseTo(0, 5);
  });

  it('returns ~100 cents for a semitone above', () => {
    // A4 = 440, A#4 = 440 * 2^(1/12) ≈ 466.16
    const f0 = 440 * Math.pow(2, 1 / 12);
    expect(centError(f0, 440)).toBeCloseTo(100, 1);
  });

  it('returns ~-100 cents for a semitone below', () => {
    const f0 = 440 * Math.pow(2, -1 / 12);
    expect(centError(f0, 440)).toBeCloseTo(-100, 1);
  });

  it('is octave-invariant: one octave up gives 0 cents', () => {
    expect(centError(880, 440)).toBeCloseTo(0, 5);
  });

  it('is octave-invariant: one octave down gives 0 cents', () => {
    expect(centError(220, 440)).toBeCloseTo(0, 5);
  });

  it('handles two octaves up → 0 cents', () => {
    expect(centError(1760, 440)).toBeCloseTo(0, 5);
  });

  it('returns ~386.3 cents for just intonation Ga (5/4)', () => {
    const target = 440;
    const f0 = 440 * (5 / 4);
    expect(centError(f0, target)).toBeCloseTo(386.3, 0);
  });
});

// ─── centToAccuracy() ────────────────────────────────────────────────────────
describe('centToAccuracy', () => {
  it('0 cents → 100%', () => {
    expect(centToAccuracy(0)).toBe(100);
  });

  it('20 cents → 90%', () => {
    expect(centToAccuracy(20)).toBe(90);
  });

  it('200 cents → 0%', () => {
    expect(centToAccuracy(200)).toBe(0);
  });

  it('300 cents → 0% (clamped)', () => {
    expect(centToAccuracy(300)).toBe(0);
  });

  it('-20 cents → 90% (symmetric)', () => {
    expect(centToAccuracy(-20)).toBe(90);
  });

  it('is monotonically decreasing for increasing |cents|', () => {
    const values = [0, 5, 10, 20, 50, 100, 150, 200, 300];
    for (let i = 1; i < values.length; i++) {
      expect(centToAccuracy(values[i])).toBeLessThanOrEqual(
        centToAccuracy(values[i - 1])
      );
    }
  });
});

// ─── frameAccuracy() ─────────────────────────────────────────────────────────
describe('frameAccuracy', () => {
  it('returns 100% for perfect pitch', () => {
    expect(frameAccuracy(440, 440)).toBe(100);
  });

  it('returns 0% for f0 = 0 (unvoiced)', () => {
    expect(frameAccuracy(0, 440)).toBe(0);
  });

  it('returns ~90% for 20 cents off', () => {
    const f0 = 440 * Math.pow(2, 20 / 1200);
    expect(frameAccuracy(f0, 440)).toBeCloseTo(90, 1);
  });
});

// ─── getTargetFrequency() ────────────────────────────────────────────────────
describe('getTargetFrequency', () => {
  it('diabetes: Sa × 5/4', () => {
    expect(getTargetFrequency(440, 'diabetes')).toBeCloseTo(550, 1);
  });

  it('thyroid: Sa × 3/2', () => {
    expect(getTargetFrequency(440, 'thyroid')).toBeCloseTo(660, 1);
  });

  it('hypertension: Sa × 4/3', () => {
    expect(getTargetFrequency(440, 'hypertension')).toBeCloseTo(
      440 * (4 / 3),
      1
    );
  });
});

// ─── CONDITION_RATIOS ────────────────────────────────────────────────────────
describe('CONDITION_RATIOS (just intonation)', () => {
  it('diabetes ratio is 5/4', () => {
    expect(CONDITION_RATIOS.diabetes).toBe(1.25);
  });

  it('thyroid ratio is 3/2', () => {
    expect(CONDITION_RATIOS.thyroid).toBe(1.5);
  });

  it('hypertension ratio is 4/3', () => {
    expect(CONDITION_RATIOS.hypertension).toBeCloseTo(4 / 3, 10);
  });
});

// ─── computeEvalAccuracy() ───────────────────────────────────────────────────
describe('computeEvalAccuracy', () => {
  it('returns 100% accuracy for frames at exact target frequency', () => {
    const target = 440;
    const frames: PitchFrame[] = [];
    // Start at t=0, generate 8 seconds of perfect chanting (hop ~0.01s)
    for (let i = 0; i < 800; i++) {
      frames.push(makeFrame(i * 0.01, target));
    }

    const result = computeEvalAccuracy(frames, target);
    expect(result.meanAccuracy).toBeCloseTo(100, 1);
  });

  it('discards the first 1s of onset transient', () => {
    const target = 440;
    const frames: PitchFrame[] = [];
    // First 1s: wildly off-pitch
    for (let i = 0; i < 100; i++) {
      frames.push(makeFrame(i * 0.01, 300)); // very wrong
    }
    // After 1s: perfect pitch
    for (let i = 100; i < 900; i++) {
      frames.push(makeFrame(i * 0.01, target));
    }

    const result = computeEvalAccuracy(frames, target);
    // Should be close to 100 because the bad onset frames are discarded
    expect(result.meanAccuracy).toBeGreaterThan(95);
  });

  it('returns 0% for unvoiced frames (f0=0)', () => {
    const target = 440;
    const frames = [makeFrame(2, 0), makeFrame(3, 0), makeFrame(4, 0)];
    const result = computeEvalAccuracy(frames, target);
    expect(result.meanAccuracy).toBe(0);
  });
});

// ─── evaluationGatePassed() ──────────────────────────────────────────────────
describe('evaluationGatePassed', () => {
  it('passes when accuracy ≥ 90% and voiced ≥ 7.5s', () => {
    const target = 440;
    const frames: PitchFrame[] = [];
    for (let i = 0; i < 1000; i++) {
      frames.push(makeFrame(i * 0.01, target));
    }

    const result = evaluationGatePassed(frames, target);
    expect(result.passed).toBe(true);
    expect(result.accuracy).toBeGreaterThanOrEqual(90);
  });

  it('fails when voiced time is too short', () => {
    const target = 440;
    // Only 3 seconds of frames
    const frames: PitchFrame[] = [];
    for (let i = 0; i < 300; i++) {
      frames.push(makeFrame(i * 0.01, target));
    }

    const result = evaluationGatePassed(frames, target);
    expect(result.passed).toBe(false);
  });

  it('fails when accuracy is below threshold', () => {
    const target = 440;
    // 10 seconds of frames, but 50 cents off → accuracy ~75%
    const f0 = 440 * Math.pow(2, 50 / 1200);
    const frames: PitchFrame[] = [];
    for (let i = 0; i < 1000; i++) {
      frames.push(makeFrame(i * 0.01, f0));
    }

    const result = evaluationGatePassed(frames, target);
    expect(result.passed).toBe(false);
    expect(result.accuracy).toBeLessThan(90);
  });
});
