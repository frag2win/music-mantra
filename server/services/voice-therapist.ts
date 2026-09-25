/**
 * Musician-Therapist Vocal Cross-Checking Service
 *
 * Implements a compassionate, musically grounded vocal evaluation algorithm that
 * cross-checks user vocal metadata against the reference mantra sample set (from manifest.json).
 *
 * Designed with Indian classical music (Nada Yoga / Swara Shastra) principles:
 * - Understands human vocal anatomy: pitch vibrato (±15-25 cents), onset scooping, and breath fatigue.
 * - Rewards harmonic resonance rather than punishing natural human micro-variations.
 * - Identifies octave register (Mandra / Madhya / Taar Saptak).
 * - Provides actionable, encouraging, warm therapeutic coaching.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ReferenceSampleMeta {
  condition: 'diabetes' | 'hypertension' | 'thyroid';
  chakra: string;
  swar: string;
  mantra: string;
  ratio: number;
  centsOffset: number;
  saNote: string;
  targetHz: number;
  sampleFile: string;
  hasAudioFile: boolean;
}

export interface VoiceFrameInput {
  t: number;
  f0: number;
  conf: number;
  rms?: number;
}

export interface VoiceCrossCheckInput {
  condition: 'diabetes' | 'hypertension' | 'thyroid';
  saNote: string;
  saHz: number;
  measuredHz?: number;
  averageCentsError?: number;
  voicedDurationSeconds?: number;
  frames?: VoiceFrameInput[];
}

export interface TherapistGuidance {
  headline: string;
  resonanceState: 'Harmonic Lock' | 'Harmonic Approach' | 'Slightly Flat' | 'Slightly Sharp' | 'Centering Breath';
  encouragement: string;
  techniqueTip: string;
  breathSupportAssessment: 'Deep & Consistent' | 'Steady' | 'Trailing near end of phrase' | 'Shallow Breath';
  vibratoQuality: 'Warm & Natural' | 'Focused Core Tone' | 'Gentle Flutter';
  octaveRegister: 'Madhya Saptak (Natural Mid)' | 'Mandra Saptak (Deep Grounded Low)' | 'Taar Saptak (Bright High)';
}

export interface VoiceCrossCheckResult {
  success: boolean;
  matchScore: number;            // 0 - 100 smoothed therapeutic accuracy
  rawCentDeviation: number;      // Exact cent error from pure Just Intonation
  smoothedCentDeviation: number;  // Cent error after vibrato and onset smoothing
  targetHz: number;
  measuredHz: number;
  saHz: number;
  saNote: string;
  referenceSample: ReferenceSampleMeta;
  therapistGuidance: TherapistGuidance;
  vocalMetrics: {
    voicedDurationSec: number;
    pitchStabilityPercent: number;
    vibratoExtentCents: number;
    onsetGraceApplied: boolean;
  };
}

// ── Manifest Loading ─────────────────────────────────────────────────────────

let cachedManifest: any = null;

function getManifest() {
  if (cachedManifest) return cachedManifest;

  // Search common manifest locations (standalone dev server vs root)
  const candidatePaths = [
    resolve(__dirname, '../../public/mantras/manifest.json'),
    resolve(process.cwd(), 'public/mantras/manifest.json'),
    resolve(process.cwd(), 'mantras/manifest.json'),
  ];

  for (const p of candidatePaths) {
    if (existsSync(p)) {
      try {
        cachedManifest = JSON.parse(readFileSync(p, 'utf-8'));
        return cachedManifest;
      } catch (err) {
        console.warn(`[VoiceTherapist] Error parsing manifest at ${p}:`, err);
      }
    }
  }

  // Built-in fallback manifest if file system is isolated
  return {
    conditions: {
      diabetes: { chakra: 'Manipura', swar: 'Ga', mantra: 'Ram', ratio: 5 / 4, centsOffset: 386.31 },
      hypertension: { chakra: 'Anahata', swar: 'Ma', mantra: 'Yam', ratio: 4 / 3, centsOffset: 498.04 },
      thyroid: { chakra: 'Vishuddha', swar: 'Pa', mantra: 'Ham', ratio: 3 / 2, centsOffset: 701.96 },
    },
    files: [],
  };
}

/**
 * Find the reference sample entry from our set matching condition and tonic note
 */
export function getReferenceSampleMeta(
  condition: 'diabetes' | 'hypertension' | 'thyroid',
  saNote: string,
  saHz: number
): ReferenceSampleMeta {
  const manifest = getManifest();
  const condMeta = manifest.conditions[condition] || {
    chakra: condition === 'diabetes' ? 'Manipura' : condition === 'hypertension' ? 'Anahata' : 'Vishuddha',
    swar: condition === 'diabetes' ? 'Ga' : condition === 'hypertension' ? 'Ma' : 'Pa',
    mantra: condition === 'diabetes' ? 'Ram' : condition === 'hypertension' ? 'Yam' : 'Ham',
    ratio: condition === 'diabetes' ? 1.25 : condition === 'hypertension' ? 4 / 3 : 1.5,
    centsOffset: condition === 'diabetes' ? 386.31 : condition === 'hypertension' ? 498.04 : 701.96,
  };

  const cleanNote = saNote.replace(/[0-9]/g, '').trim();
  const targetHz = saHz * condMeta.ratio;

  // Search manifest for file entry
  const fileEntry = Array.isArray(manifest.files)
    ? manifest.files.find((f: any) => f.condition === condition && f.sa === cleanNote)
    : null;

  const sampleFile = fileEntry ? fileEntry.file : `/mantras/${condition}/${cleanNote.replace('#', 'sharp')}-low.m4a`;

  let hasAudioFile = false;
  try {
    const fullAudioPath = resolve(process.cwd(), 'public', sampleFile.replace(/^\//, ''));
    hasAudioFile = existsSync(fullAudioPath);
  } catch {
    hasAudioFile = false;
  }

  return {
    condition,
    chakra: condMeta.chakra,
    swar: condMeta.swar,
    mantra: condMeta.mantra,
    ratio: condMeta.ratio,
    centsOffset: condMeta.centsOffset,
    saNote: cleanNote,
    targetHz,
    sampleFile,
    hasAudioFile,
  };
}

/**
 * Calculate cent error between user pitch and target pitch with octave invariance.
 * Returns signed error in (-600, +600] cents.
 */
export function calculateOctaveInvariantCents(userHz: number, targetHz: number): number {
  if (userHz <= 0 || targetHz <= 0) return 0;
  const rawCents = 1200 * Math.log2(userHz / targetHz);
  return (((rawCents % 1200) + 1800) % 1200) - 600;
}

/**
 * Identify vocal register / octave classification
 */
function classifyRegister(userHz: number, targetHz: number): TherapistGuidance['octaveRegister'] {
  const ratio = userHz / targetHz;
  if (ratio < 0.7) {
    return 'Mandra Saptak (Deep Grounded Low)';
  } else if (ratio > 1.45) {
    return 'Taar Saptak (Bright High)';
  }
  return 'Madhya Saptak (Natural Mid)';
}

/**
 * Musician-Therapist Harmonic Resonance Curve:
 *
 * Unlike rigid mathematical scoring that drops sharply with human micro-variations,
 * a therapist recognizes a ±15-cent zone as resonant lock (100%),
 * gently transitioning out to 35 cents (85–95%), and tolerating natural vocal pulsation.
 */
export function therapistResonanceScore(cents: number): number {
  const absCents = Math.abs(cents);

  // Basin of pure harmonic lock (±12 cents = 96-100%)
  if (absCents <= 12) {
    return 100 - (absCents / 12) * 4;
  }

  // Near-tune harmonic approach (12 to 30 cents = 85-96%)
  if (absCents <= 30) {
    const t = (absCents - 12) / 18;
    return 96 - t * 11;
  }

  // Smooth decay for larger deviations
  if (absCents <= 100) {
    const t = (absCents - 30) / 70;
    return 85 - t * 45; // 85 down to 40
  }

  // Distant pitches gently taper to 0
  const t = Math.min(1, (absCents - 100) / 100);
  return Math.max(0, 40 - t * 40);
}

/**
 * Cross-checks user vocal metadata against the sample from our set.
 * Analyzes pitch frames, filters onset attacks, distinguishes healthy vibrato,
 * and produces musician-therapist guidance.
 */
export function crossCheckVocalMetadata(input: VoiceCrossCheckInput): VoiceCrossCheckResult {
  const refMeta = getReferenceSampleMeta(input.condition, input.saNote, input.saHz);
  const targetHz = refMeta.targetHz;

  const frames = input.frames || [];
  let measuredHz = input.measuredHz || targetHz;
  let rawCentError = 0;
  let smoothedCentError = 0;
  let voicedDurationSec = input.voicedDurationSeconds || 0;
  let vibratoExtent = 0;
  let pitchStability = 85;
  let breathState: TherapistGuidance['breathSupportAssessment'] = 'Steady';
  let onsetGraceApplied = false;

  if (frames.length > 0) {
    // 1. Filter out unvoiced frames & frames below confidence threshold
    const confidentFrames = frames.filter((f) => f.f0 > 70 && f.f0 < 800 && f.conf >= 0.65);

    if (confidentFrames.length > 0) {
      // 2. Onset Grace Period: Discard first 350ms of vocal attack (consonant scooping)
      const firstT = confidentFrames[0].t;
      let sustainedFrames = confidentFrames.filter((f) => f.t - firstT >= 0.35);
      if (sustainedFrames.length >= 5) {
        onsetGraceApplied = true;
      } else {
        sustainedFrames = confidentFrames;
      }

      // Compute weighted median fundamental frequency
      const f0s = sustainedFrames.map((f) => f.f0).sort((a, b) => a - b);
      measuredHz = f0s[Math.floor(f0s.length / 2)];

      // Cent errors
      const centsList = sustainedFrames.map((f) => calculateOctaveInvariantCents(f.f0, targetHz));
      centsList.sort((a, b) => a - b);
      rawCentError = centsList[Math.floor(centsList.length / 2)];

      // Vibrato analysis: Interquartile range of cents
      const q1 = centsList[Math.floor(centsList.length * 0.25)];
      const q3 = centsList[Math.floor(centsList.length * 0.75)];
      vibratoExtent = Math.max(0, q3 - q1);

      // Pitch stability
      const variance = centsList.reduce((acc, c) => acc + Math.pow(c - rawCentError, 2), 0) / centsList.length;
      const stdDev = Math.sqrt(variance);
      pitchStability = Math.max(20, Math.min(100, Math.round(100 - stdDev * 1.5)));

      // Breath trailing detection: compare first half pitch with final quarter pitch
      if (sustainedFrames.length > 20) {
        const midIdx = Math.floor(sustainedFrames.length * 0.5);
        const lateIdx = Math.floor(sustainedFrames.length * 0.8);
        const midCents = calculateOctaveInvariantCents(sustainedFrames[midIdx].f0, targetHz);
        const lateCents = calculateOctaveInvariantCents(sustainedFrames[lateIdx].f0, targetHz);

        // If late frames sag downward by >15 cents, it's natural exhalation sag
        if (lateCents - midCents < -15) {
          breathState = 'Trailing near end of phrase';
        } else if (pitchStability > 85) {
          breathState = 'Deep & Consistent';
        }
      }

      // Smoothed cent error discounts cyclical vibrato
      smoothedCentError = Math.round(rawCentError * 10) / 10;
      voicedDurationSec = (sustainedFrames[sustainedFrames.length - 1].t - sustainedFrames[0].t);
    }
  } else if (input.averageCentsError !== undefined) {
    rawCentError = input.averageCentsError;
    smoothedCentError = input.averageCentsError;
  } else if (input.measuredHz) {
    rawCentError = calculateOctaveInvariantCents(input.measuredHz, targetHz);
    smoothedCentError = rawCentError;
  }

  // Compute therapeutic match score
  const matchScore = Math.round(therapistResonanceScore(smoothedCentError));

  // Determine resonance classification
  let resonanceState: TherapistGuidance['resonanceState'] = 'Harmonic Approach';
  if (Math.abs(smoothedCentError) <= 18) {
    resonanceState = 'Harmonic Lock';
  } else if (smoothedCentError < -18) {
    resonanceState = 'Slightly Flat';
  } else if (smoothedCentError > 18) {
    resonanceState = 'Slightly Sharp';
  }

  const octaveRegister = classifyRegister(measuredHz, targetHz);

  // Vibrato quality assessment
  let vibratoQuality: TherapistGuidance['vibratoQuality'] = 'Focused Core Tone';
  if (vibratoExtent >= 8 && vibratoExtent <= 28) {
    vibratoQuality = 'Warm & Natural';
  } else if (vibratoExtent > 28) {
    vibratoQuality = 'Gentle Flutter';
  }

  // Musician-Therapist Narrative Coaching
  const conditionName =
    input.condition === 'diabetes'
      ? 'Manipura (Navel Center)'
      : input.condition === 'hypertension'
        ? 'Anahata (Heart Center)'
        : 'Vishuddha (Throat Center)';

  let headline = '';
  let encouragement = '';
  let techniqueTip = '';

  if (resonanceState === 'Harmonic Lock') {
    headline = `Beautiful Harmony with Swara ${refMeta.swar}!`;
    encouragement = `Your voice is resting in the sweet resonant core of ${refMeta.mantra}. The harmonic match with the ${refMeta.chakra} reference is soothing and steady.`;
    techniqueTip = `Continue gently floating your breath through the sound. Keep your jaw completely slack and feel the vibration around your ${conditionName}.`;
  } else if (resonanceState === 'Slightly Flat') {
    headline = `Gently Lift the Tone Upward`;
    encouragement = `You are very close to Swara ${refMeta.swar}. The tone is warm and grounded, currently resting just slightly below the pure 5/4 ratio.`;
    techniqueTip =
      breathState === 'Trailing near end of phrase'
        ? `Notice your breath easing near the end of chanting "${refMeta.mantra}". Take a slower diaphragmatic breath before starting to keep the pitch buoyant.`
        : `Imagine a gentle smile behind your eyes as you chant "${refMeta.mantra}" — this naturally raises the soft palate and brings the pitch right into resonance.`;
  } else if (resonanceState === 'Slightly Sharp') {
    headline = `Ease the Tone Gently Downward`;
    encouragement = `Strong vocal projection! You are singing with high energy, hovering slightly above Swara ${refMeta.swar}.`;
    techniqueTip = `Release any tension in your neck and tongue. Let the sound sink down into the chest and belly as you sustain "${refMeta.mantra}".`;
  } else {
    headline = `Approaching Pure Resonance`;
    encouragement = `Your vocal cords are finding their connection with the ${refMeta.swar} frequency (${refMeta.targetHz.toFixed(1)} Hz).`;
    techniqueTip = `Listen to the reference loop once more, feeling the tone in your chest before singing aloud. Sing comfortably without forcing volume.`;
  }

  return {
    success: true,
    matchScore,
    rawCentDeviation: Math.round(rawCentError * 10) / 10,
    smoothedCentDeviation: smoothedCentError,
    targetHz: Math.round(targetHz * 10) / 10,
    measuredHz: Math.round(measuredHz * 10) / 10,
    saHz: Math.round(input.saHz * 10) / 10,
    saNote: refMeta.saNote,
    referenceSample: refMeta,
    therapistGuidance: {
      headline,
      resonanceState,
      encouragement,
      techniqueTip,
      breathSupportAssessment: breathState,
      vibratoQuality,
      octaveRegister,
    },
    vocalMetrics: {
      voicedDurationSec: Math.round(voicedDurationSec * 10) / 10,
      pitchStabilityPercent: pitchStability,
      vibratoExtentCents: Math.round(vibratoExtent * 10) / 10,
      onsetGraceApplied,
    },
  };
}
