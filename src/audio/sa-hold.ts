/**
 * sa_hold Evaluation Engine — Compliant with TRD §6.4
 *
 * Alternative flow to 15s free song singing: user holds a single comfortable
 * pitch (Sa) continuously for 4 seconds.
 * Sa is determined as the median frequency of stable frames (spread < 25 cents).
 */

import type { PitchFrame, NoteName } from './scale-detector';
import { centError } from './accuracy';

const NOTE_NAMES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export interface SaHoldResult {
  success: boolean;
  saNote: NoteName;
  saHz: number;
  spreadCents: number;
  voicedSeconds: number;
  stable: boolean;
}

export function evaluateSaHold(
  frames: PitchFrame[],
  targetDurationSeconds = 4.0,
  maxSpreadCents = 25.0
): SaHoldResult {
  const voicedFrames = frames.filter((f) => f.conf > 0.6 && f.f0 > 70 && f.f0 < 800);
  const voicedSeconds = voicedFrames.length * 0.0116;

  if (voicedFrames.length === 0) {
    return {
      success: false,
      saNote: 'C',
      saHz: 261.63,
      spreadCents: 999,
      voicedSeconds: 0,
      stable: false,
    };
  }

  // Extract frequencies and sort to find median
  const freqs = voicedFrames.map((f) => f.f0).sort((a, b) => a - b);
  const medianHz = freqs[Math.floor(freqs.length / 2)];

  // Measure spread in cents relative to median
  const centsDeviations = freqs.map((f) => Math.abs(centError(f, medianHz)));
  // 90th percentile spread to reject accidental vocal onset glottal clicks
  const sortedDeviations = [...centsDeviations].sort((a, b) => a - b);
  const p90Spread = sortedDeviations[Math.floor(sortedDeviations.length * 0.9)] || 0;

  const stable = p90Spread <= maxSpreadCents;
  const success = voicedSeconds >= targetDurationSeconds && stable;

  // Determine note name from median frequency
  const midi = Math.round(69 + 12 * Math.log2(medianHz / 440));
  const pc = ((midi % 12) + 12) % 12;
  const saNote = NOTE_NAMES[pc];

  return {
    success,
    saNote,
    saHz: medianHz,
    spreadCents: p90Spread,
    voicedSeconds,
    stable,
  };
}
