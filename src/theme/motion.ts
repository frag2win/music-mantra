/**
 * Centralized motion timing and relaxation cadences
 *
 * Implements chromotherapy and wellness pacing patterns inspired by Calm & Headspace:
 * - 4-1-6 cadence: Clinical relaxation rhythm for blood pressure & hypertension (Anahata)
 * - 8-10s solar pulse: Gentle metabolic resonance for solar plexus (Manipura)
 * - 6s sound-wave ripple: Vocal tract resonance rhythm for throat chakra (Vishuddha)
 */

export const MOTION_TIMINGS = {
  // Hypertension / Anahata Breathing Circle
  breathCycle: {
    inhaleSec: 4.0,
    holdSec: 1.0,
    exhaleSec: 6.0,
    totalSec: 11.0,
  },

  // Diabetes / Manipura Sun Pulse
  sunPulse: {
    cycleSec: 8.5,
    lotusRotationSec: 60.0,
  },

  // Thyroid / Vishuddha Sound Ripples
  soundRipple: {
    cycleSec: 6.0,
    waveCount: 3,
  },

  // Pitch meter needle smoothing
  pitchNeedle: {
    transitionMs: 180,
  },
} as const;

export type AnimationIntensity = 'full' | 'subtle' | 'off';
