/**
 * Pitch Accuracy Module
 *
 * Computes how accurately the user is chanting relative to the target
 * frequency T = Sa × ratio(condition), using an octave-invariant cent
 * error formula.
 *
 * Formula:
 *   e = ((1200·log₂(f0/T) mod 1200) + 1800) mod 1200 − 600   (cents)
 *   a = max(0, 100 − 0.5·|e|)                                 (% accuracy)
 *
 * So: 0 cents error = 100% accuracy, 20 cents = 90%, 200 cents = 0%.
 */

import type { PitchFrame } from './scale-detector';

// ─── Condition → Interval Ratios (Just Intonation) ──────────────────────────
export const CONDITION_RATIOS = {
  diabetes: 5 / 4,      // Ga — Major 3rd (386.3 cents)
  thyroid: 3 / 2,       // Pa — Perfect 5th (702.0 cents)
  hypertension: 4 / 3,  // Ma — Perfect 4th (498.0 cents)
} as const;

export type Condition = keyof typeof CONDITION_RATIOS;

// ─── Configuration ──────────────────────────────────────────────────────────
export interface AccuracyConfig {
  /** Minimum accuracy to pass the evaluation gate (default 90) */
  passThreshold: number;
  /** Voiced seconds required for the evaluation gate (default 7.5) */
  evalVoicedSeconds: number;
  /** Hold duration in minutes (default 10) */
  holdMinutes: number;
  /** Minimum share of voiced time during the hold (default 0.5) */
  minVoicedShare: number;
  /** Tuning system: 'just' or 'equal' (default 'just') */
  tuning: 'just' | 'equal';
  /** Seconds to discard at the start of chanting (onset transient, default 1) */
  onsetDiscardSeconds: number;
  /** Minimum YIN confidence to count a frame (default 0.85) */
  minConfidence: number;
  /** Rolling window for live display in seconds (default 2) */
  rollingWindowSeconds: number;
}

export const DEFAULT_ACCURACY_CONFIG: AccuracyConfig = {
  passThreshold: 90,
  evalVoicedSeconds: 7.5,
  holdMinutes: 10,
  minVoicedShare: 0.5,
  tuning: 'just',
  onsetDiscardSeconds: 1,
  minConfidence: 0.85,
  rollingWindowSeconds: 2,
};

/**
 * Compute the target frequency for a given condition and Sa.
 */
export function getTargetFrequency(
  saHz: number,
  condition: Condition
): number {
  return saHz * CONDITION_RATIOS[condition];
}

/**
 * Compute the octave-invariant cent error between a sung f0 and the target.
 * Returns signed cents in the range (−600, +600].
 */
export function centError(f0: number, target: number): number {
  const rawCents = 1200 * Math.log2(f0 / target);
  return (((rawCents % 1200) + 1800) % 1200) - 600;
}

/**
 * Convert a cent error to an accuracy percentage.
 * 0 cents → 100%, 20 cents → 90%, 200 cents → 0%.
 */
export function centToAccuracy(cents: number): number {
  return Math.max(0, 100 - 0.5 * Math.abs(cents));
}

/**
 * Compute the accuracy for a single pitch frame against a target frequency.
 */
export function frameAccuracy(f0: number, target: number): number {
  if (f0 <= 0) return 0;
  return centToAccuracy(centError(f0, target));
}

/**
 * Compute the mean accuracy over an array of voiced frames,
 * discarding the onset transient and low-confidence frames.
 *
 * @param frames     - Array of PitchFrame from the YIN tracker
 * @param target     - Target frequency in Hz
 * @param config     - Accuracy configuration
 * @returns { meanAccuracy, voicedSeconds, frameAccuracies }
 */
export function computeEvalAccuracy(
  frames: PitchFrame[],
  target: number,
  config: Partial<AccuracyConfig> = {}
): {
  meanAccuracy: number;
  voicedSeconds: number;
  frameAccuracies: number[];
} {
  const cfg = { ...DEFAULT_ACCURACY_CONFIG, ...config };

  // Filter: voiced, above confidence, after onset transient
  const startTime = frames.length > 0 ? frames[0].t : 0;
  const validFrames = frames.filter(
    (f) =>
      f.f0 > 0 &&
      f.conf >= cfg.minConfidence &&
      f.t - startTime >= cfg.onsetDiscardSeconds
  );

  const frameAccuracies = validFrames.map((f) => frameAccuracy(f.f0, target));
  const voicedSeconds = validFrames.length > 0
    ? validFrames[validFrames.length - 1].t - validFrames[0].t
    : 0;

  const meanAccuracy =
    frameAccuracies.length > 0
      ? frameAccuracies.reduce((a, b) => a + b, 0) / frameAccuracies.length
      : 0;

  return { meanAccuracy, voicedSeconds, frameAccuracies };
}

/**
 * Compute a rolling-window accuracy for the live display.
 * Uses the most recent `rollingWindowSeconds` of voiced frames.
 */
export function computeRollingAccuracy(
  frames: PitchFrame[],
  target: number,
  config: Partial<AccuracyConfig> = {}
): number {
  const cfg = { ...DEFAULT_ACCURACY_CONFIG, ...config };

  if (frames.length === 0) return 0;

  const now = frames[frames.length - 1].t;
  const windowStart = now - cfg.rollingWindowSeconds;

  const recentFrames = frames.filter(
    (f) =>
      f.f0 > 0 &&
      f.conf >= cfg.minConfidence &&
      f.t >= windowStart
  );

  if (recentFrames.length === 0) return 0;

  const accuracies = recentFrames.map((f) => frameAccuracy(f.f0, target));
  return accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
}

/**
 * Check whether the evaluation gate has been passed.
 */
export function evaluationGatePassed(
  frames: PitchFrame[],
  target: number,
  config: Partial<AccuracyConfig> = {}
): { passed: boolean; accuracy: number; voicedSeconds: number } {
  const cfg = { ...DEFAULT_ACCURACY_CONFIG, ...config };
  const { meanAccuracy, voicedSeconds } = computeEvalAccuracy(
    frames,
    target,
    cfg
  );

  return {
    passed: meanAccuracy >= cfg.passThreshold && voicedSeconds >= cfg.evalVoicedSeconds,
    accuracy: meanAccuracy,
    voicedSeconds,
  };
}
