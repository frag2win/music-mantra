/**
 * Scale Detector — Krumhansl–Schmuckler Key-Finding Algorithm
 *
 * Converts voiced f0 frames to pitch classes (A4 = 440 Hz), builds a
 * 12-bin chroma histogram, and correlates against the 24 major/minor
 * Krumhansl–Schmuckler profiles to find the most likely tonic (Sa).
 */

// ─── Note Names ──────────────────────────────────────────────────────────────
const NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F',
  'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const;

export type NoteName = (typeof NOTE_NAMES)[number];

// ─── Krumhansl–Schmuckler Key Profiles ───────────────────────────────────────
// Weights representing how strongly each pitch class belongs to a key.
// Index 0 = tonic, 1 = minor 2nd, 2 = major 2nd, etc.
const MAJOR_PROFILE = [
  6.35, 2.23, 3.48, 2.33, 4.38, 4.09,
  2.52, 5.19, 2.39, 3.66, 2.29, 2.88,
];

const MINOR_PROFILE = [
  6.33, 2.68, 3.52, 5.38, 2.60, 3.53,
  2.54, 4.75, 3.98, 2.69, 3.34, 3.17,
];

// ─── Types ───────────────────────────────────────────────────────────────────
export interface PitchFrame {
  /** Timestamp in seconds */
  t: number;
  /** Fundamental frequency in Hz (0 = unvoiced) */
  f0: number;
  /** Confidence 0–1 */
  conf: number;
}

export interface ScaleDetectionResult {
  /** Detected tonic note name (Sa) */
  tonic: NoteName;
  /** Tonic pitch class index (0 = C, 1 = C#, ...) */
  tonicPitchClass: number;
  /** Whether the best match is major or minor */
  mode: 'major' | 'minor';
  /** Pearson correlation of the best match (0–1) */
  confidence: number;
  /** Runner-up key */
  runnerUp: { tonic: NoteName; mode: 'major' | 'minor'; confidence: number };
  /** Whether confidence is below the reliability threshold */
  lowConfidence: boolean;
  /** Sa frequency in the octave nearest the user's median sung pitch */
  saFrequency: number;
  /** The 12-bin chroma histogram used for detection */
  chromaHistogram: number[];
}

/**
 * Convert a frequency (Hz) to a pitch class index (0–11), where 0 = C.
 * Uses A4 = 440 Hz as the reference.
 */
export function frequencyToPitchClass(f0: number): number {
  // semitones above C0
  const semitones = 12 * Math.log2(f0 / 440) + 69;
  return ((Math.round(semitones) % 12) + 12) % 12;
}

/**
 * Convert a frequency (Hz) to a fractional MIDI note number.
 */
function frequencyToMidi(f0: number): number {
  return 12 * Math.log2(f0 / 440) + 69;
}

/**
 * Build a 12-bin chroma histogram from voiced pitch frames.
 */
export function buildChromaHistogram(frames: PitchFrame[]): number[] {
  const histogram = new Array(12).fill(0);
  for (const frame of frames) {
    if (frame.f0 > 0 && frame.conf > 0) {
      const pc = frequencyToPitchClass(frame.f0);
      histogram[pc] += frame.conf; // Weight by confidence
    }
  }

  // Normalize
  const maxVal = Math.max(...histogram);
  if (maxVal > 0) {
    for (let i = 0; i < 12; i++) {
      histogram[i] /= maxVal;
    }
  }

  return histogram;
}

/**
 * Compute the Pearson correlation coefficient between two arrays.
 */
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Rotate an array by `shift` positions to the left.
 */
function rotateArray(arr: number[], shift: number): number[] {
  const n = arr.length;
  const s = ((shift % n) + n) % n;
  return [...arr.slice(s), ...arr.slice(0, s)];
}

/**
 * Find the median f0 from voiced frames.
 */
function medianF0(frames: PitchFrame[]): number {
  const voiced = frames.filter((f) => f.f0 > 0).map((f) => f.f0);
  if (voiced.length === 0) return 440;
  voiced.sort((a, b) => a - b);
  return voiced[Math.floor(voiced.length / 2)];
}

/**
 * Given a pitch class and a target frequency region, return the Sa frequency
 * in the octave nearest to the target.
 */
function saInNearestOctave(pitchClass: number, medianFreq: number): number {
  // C0 ≈ 16.35 Hz
  const c0 = 440 * Math.pow(2, -69 / 12);
  // Base frequency for this pitch class in octave 0
  const baseFreq = c0 * Math.pow(2, pitchClass / 12);

  // Find the octave that puts the Sa closest to the median
  let bestFreq = baseFreq;
  let bestDist = Infinity;

  for (let octave = 0; octave <= 8; octave++) {
    const freq = baseFreq * Math.pow(2, octave);
    const dist = Math.abs(frequencyToMidi(freq) - frequencyToMidi(medianFreq));
    if (dist < bestDist) {
      bestDist = dist;
      bestFreq = freq;
    }
  }

  return bestFreq;
}

/**
 * Detect the musical key (scale and tonic / Sa) from an array of pitch frames.
 *
 * @param frames - Array of PitchFrame from the YIN tracker
 * @param confidenceThreshold - Below this Pearson r, flag as low confidence (default 0.6)
 * @returns ScaleDetectionResult
 */
export function detectScale(
  frames: PitchFrame[],
  confidenceThreshold = 0.6
): ScaleDetectionResult {
  const histogram = buildChromaHistogram(frames);
  const median = medianF0(frames);

  // Correlate against all 24 keys (12 tonics × 2 modes)
  const results: Array<{
    tonic: number;
    mode: 'major' | 'minor';
    r: number;
  }> = [];

  for (let tonic = 0; tonic < 12; tonic++) {
    // Rotate the histogram so that `tonic` is at index 0
    const rotated = rotateArray(histogram, tonic);

    const rMajor = pearsonCorrelation(rotated, MAJOR_PROFILE);
    results.push({ tonic, mode: 'major', r: rMajor });

    const rMinor = pearsonCorrelation(rotated, MINOR_PROFILE);
    results.push({ tonic, mode: 'minor', r: rMinor });
  }

  // Sort descending by correlation
  results.sort((a, b) => b.r - a.r);

  const best = results[0];
  const second = results[1];

  return {
    tonic: NOTE_NAMES[best.tonic],
    tonicPitchClass: best.tonic,
    mode: best.mode,
    confidence: best.r,
    runnerUp: {
      tonic: NOTE_NAMES[second.tonic],
      mode: second.mode,
      confidence: second.r,
    },
    lowConfidence: best.r < confidenceThreshold,
    saFrequency: saInNearestOctave(best.tonic, median),
    chromaHistogram: histogram,
  };
}
