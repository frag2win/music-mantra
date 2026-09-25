import { describe, it, expect } from 'vitest';
import {
  crossCheckVocalMetadata,
  getReferenceSampleMeta,
  therapistResonanceScore,
  calculateOctaveInvariantCents,
} from '../../server/services/voice-therapist';

describe('Musician-Therapist Vocal Cross-Checking Service', () => {
  it('correctly maps conditions to Just Intonation target swaras from manifest', () => {
    // Diabetes -> Ga (5/4 = 1.25)
    const diabetesMeta = getReferenceSampleMeta('diabetes', 'C', 261.63);
    expect(diabetesMeta.swar).toBe('Ga');
    expect(diabetesMeta.mantra).toBe('Ram');
    expect(diabetesMeta.ratio).toBe(1.25);
    expect(diabetesMeta.targetHz).toBeCloseTo(327.03, 1);

    // Hypertension -> Ma (4/3 = 1.333...)
    const hyperMeta = getReferenceSampleMeta('hypertension', 'D', 293.66);
    expect(hyperMeta.swar).toBe('Ma');
    expect(hyperMeta.mantra).toBe('Yam');
    expect(hyperMeta.ratio).toBeCloseTo(4 / 3, 4);

    // Thyroid -> Pa (3/2 = 1.5)
    const thyroidMeta = getReferenceSampleMeta('thyroid', 'A', 220.0);
    expect(thyroidMeta.swar).toBe('Pa');
    expect(thyroidMeta.mantra).toBe('Ham');
    expect(thyroidMeta.ratio).toBe(1.5);
    expect(thyroidMeta.targetHz).toBe(330.0);
  });

  it('understands human pitch micro-variations and awards harmonic lock within ±15 cents', () => {
    // Exact pitch: 100%
    expect(therapistResonanceScore(0)).toBe(100);

    // Human subtle vibrato/breathing (+8 cents) still receives 97%+
    expect(therapistResonanceScore(8)).toBeGreaterThanOrEqual(96);
    expect(therapistResonanceScore(-12)).toBeGreaterThanOrEqual(95);

    // Gentle approach (20 cents) still receives comforting ~90%
    expect(therapistResonanceScore(20)).toBeGreaterThanOrEqual(88);

    // Flat pitch (-50 cents) provides constructive guidance
    expect(therapistResonanceScore(-50)).toBeGreaterThanOrEqual(60);
  });

  it('evaluates pitch frames with onset grace period for consonant attack', () => {
    const targetHz = 327.04; // Ga from C (261.63 * 1.25)

    // Simulate singing "Ram" with initial consonant "R" scoop (low pitch for 250ms),
    // then steady pure vowel resonance at 328 Hz for 2 seconds with natural 10-cent vibrato
    const frames: Array<{ t: number; f0: number; conf: number }> = [];

    // 0.0s to 0.3s: consonant scoop at ~290 Hz (flat onset)
    for (let t = 0; t <= 0.3; t += 0.015) {
      frames.push({ t, f0: 290, conf: 0.7 });
    }

    // 0.35s to 2.5s: sustained steady vowel phonation with subtle healthy vibrato
    for (let t = 0.35; t <= 2.5; t += 0.015) {
      const vibrato = Math.sin(2 * Math.PI * 5.5 * t) * 1.5; // ~5.5Hz vibrato, ±8 cents
      frames.push({ t, f0: 327.5 + vibrato, conf: 0.95 });
    }

    const result = crossCheckVocalMetadata({
      condition: 'diabetes',
      saNote: 'C',
      saHz: 261.63,
      frames,
    });

    expect(result.success).toBe(true);
    expect(result.vocalMetrics.onsetGraceApplied).toBe(true);
    expect(result.therapistGuidance.resonanceState).toBe('Harmonic Lock');
    expect(result.matchScore).toBeGreaterThanOrEqual(94);
    expect(result.therapistGuidance.encouragement).toMatch(/harmonic/i);
  });

  it('detects natural exhalation sag and provides breath-support technique tips', () => {
    const targetHz = 327.04;
    const frames: Array<{ t: number; f0: number; conf: number }> = [];

    // Chanting sustained note, but pitch drops near the end due to running out of breath
    for (let t = 0; t <= 2.0; t += 0.02) {
      frames.push({ t, f0: targetHz, conf: 0.9 });
    }
    // Trailing breath drops from 327 down to 318 Hz
    for (let t = 2.02; t <= 3.0; t += 0.02) {
      frames.push({ t, f0: 318, conf: 0.85 });
    }

    const result = crossCheckVocalMetadata({
      condition: 'diabetes',
      saNote: 'C',
      saHz: 261.63,
      frames,
    });

    expect(result.therapistGuidance.breathSupportAssessment).toBe('Trailing near end of phrase');
    expect(result.therapistGuidance.techniqueTip).toContain('breath');
  });

  it('correctly handles octave invariance for male and female registers', () => {
    // Target is Ga at 327.04 Hz. User sings in deep low octave (163.52 Hz)
    const lowCents = calculateOctaveInvariantCents(163.52, 327.04);
    expect(Math.abs(lowCents)).toBeCloseTo(0, 1);

    const result = crossCheckVocalMetadata({
      condition: 'diabetes',
      saNote: 'C',
      saHz: 261.63,
      measuredHz: 163.52,
    });

    expect(result.therapistGuidance.octaveRegister).toContain('Mandra');
    expect(result.therapistGuidance.resonanceState).toBe('Harmonic Lock');
  });
});
