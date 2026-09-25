import { describe, it, expect } from 'vitest';
import { evaluateSaHold } from '../../src/audio/sa-hold';
import type { PitchFrame } from '../../src/audio/scale-detector';

describe('Phase 3: sa_hold 4-Second Single Note Hold Engine', () => {
  it('detects a stable 4-second hold on C4 (261.6 Hz) with spread < 25 cents', () => {
    const frames: PitchFrame[] = [];
    const baseHz = 261.63; // C4

    // 400 frames (~4.6 seconds) of steady C4 singing with minimal ±5 cents jitter
    for (let i = 0; i < 400; i++) {
      const jitterCents = 5 * Math.sin(i * 0.1);
      const f0 = baseHz * Math.pow(2, jitterCents / 1200);
      frames.push({
        t: i * 0.0116,
        f0,
        conf: 0.95,
      });
    }

    const result = evaluateSaHold(frames, 4.0, 25.0);

    expect(result.success).toBe(true);
    expect(result.saNote).toBe('C');
    expect(result.stable).toBe(true);
    expect(result.spreadCents).toBeLessThan(25.0);
    expect(Math.abs(result.saHz - 261.63)).toBeLessThan(2.0);
  });

  it('rejects unstable or wavering singing where spread > 25 cents', () => {
    const frames: PitchFrame[] = [];
    const baseHz = 440.0; // A4

    // Wavering pitch drifting by ±60 cents
    for (let i = 0; i < 400; i++) {
      const waverCents = 60 * Math.sin(i * 0.05);
      const f0 = baseHz * Math.pow(2, waverCents / 1200);
      frames.push({
        t: i * 0.0116,
        f0,
        conf: 0.95,
      });
    }

    const result = evaluateSaHold(frames, 4.0, 25.0);

    expect(result.stable).toBe(false);
    expect(result.success).toBe(false);
    expect(result.spreadCents).toBeGreaterThan(25.0);
  });

  it('fails if voiced duration is under 4 seconds', () => {
    const frames: PitchFrame[] = [];
    // Only 100 frames (~1.1 seconds)
    for (let i = 0; i < 100; i++) {
      frames.push({ t: i * 0.0116, f0: 329.63, conf: 0.95 });
    }

    const result = evaluateSaHold(frames, 4.0, 25.0);
    expect(result.success).toBe(false);
  });
});
