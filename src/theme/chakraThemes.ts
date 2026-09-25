import type { HealthCondition } from '../types';

export interface ChakraThemeConfig {
  id: HealthCondition;
  chakraName: string;
  chakraLocation: string;
  swar: string;
  mantra: string;
  emotionalIntent: string;

  // Background and Palette
  bgGradient: {
    from: string;
    via: string;
    to: string;
  };
  cardBg: string;
  cardBorder: string;

  // Accent & Chromotherapy Colors
  accent: string;
  accentSoft: string;
  secondaryAccent: string;

  // Sound-Reactive Pitch Colors (avoids commonly cited red-alert stress cues)
  pitchFeedback: {
    inTune: string;       // Resonant locked tone (Theme primary)
    nearTune: string;     // Soft harmonic approach
    offPitch: string;     // Gentle desaturated warm stone/zinc (avoids red-alert stress cues)
  };

  // Motion & Sacred Geometry
  motionPreset: 'sun-pulse' | 'breathing-circle' | 'sound-ripple';
  sacredGeometry: {
    type: 'ten-petal-lotus' | 'anahata-hexagram' | 'sixteen-petal-lotus';
    symbol: string;
  };
}

export const CHAKRA_THEMES: Record<HealthCondition, ChakraThemeConfig> = {
  diabetes: {
    id: 'diabetes',
    chakraName: 'Manipura',
    chakraLocation: 'Navel / Solar Plexus',
    swar: 'Ga',
    mantra: 'Ram',
    emotionalIntent: 'Steadiness, grounded warmth, metabolic vitality and digestive balance',

    // Warm Muted Amber & Honey Palette
    bgGradient: {
      from: '#1a160d', // Deep warm honey slate
      via: '#261e0e',  // Muted amber mid
      to: '#0d0f17',   // Serene midnight foundation
    },
    cardBg: 'rgba(38, 30, 14, 0.88)',
    cardBorder: 'rgba(245, 158, 11, 0.30)',

    accent: '#f59e0b',          // Warm glowing amber
    accentSoft: 'rgba(245, 158, 11, 0.18)',
    secondaryAccent: '#d97706',  // Muted terracotta/honey

    pitchFeedback: {
      inTune: '#fbbf24',        // Warm radiant gold
      nearTune: '#d97706',      // Gentle amber
      offPitch: '#78716c',      // Soothing neutral stone (avoids red-alert cues)
    },

    motionPreset: 'sun-pulse',
    sacredGeometry: {
      type: 'ten-petal-lotus',
      symbol: '☀️',
    },
  },

  hypertension: {
    id: 'hypertension',
    chakraName: 'Anahata',
    chakraLocation: 'Heart Center',
    swar: 'Ma',
    mantra: 'Yam',
    emotionalIntent: 'Lowering heart rate, sympathetic nervous release, compassion and steady breath',

    // Sage Green with Soft Rose Undertone Palette
    bgGradient: {
      from: '#0f1a14', // Calming sage-forest slate
      via: '#16221c',  // Deep meadow
      to: '#131114',   // Soft dusky rose twilight
    },
    cardBg: 'rgba(22, 34, 28, 0.88)',
    cardBorder: 'rgba(52, 211, 153, 0.30)',

    accent: '#10b981',          // Serene sage emerald
    accentSoft: 'rgba(16, 185, 129, 0.18)',
    secondaryAccent: '#f43f5e',  // Soft dusty rose

    pitchFeedback: {
      inTune: '#34d399',        // Soothing bright sage
      nearTune: '#10b981',      // Deep meadow
      offPitch: '#71717a',      // Cool neutral zinc (avoids red-alert cues)
    },

    motionPreset: 'breathing-circle',
    sacredGeometry: {
      type: 'anahata-hexagram',
      symbol: '🌿',
    },
  },

  thyroid: {
    id: 'thyroid',
    chakraName: 'Vishuddha',
    chakraLocation: 'Throat Center',
    swar: 'Pa',
    mantra: 'Ham',
    emotionalIntent: 'Unhurried breathing, vocal clarity, cellular communication and deep poise',

    // Soft Slate & Teal Blue Palette
    bgGradient: {
      from: '#0c1a24', // Deep slate cyan
      via: '#10222f',  // Calming ocean teal
      to: '#0b111a',   // Cosmic midnight indigo
    },
    cardBg: 'rgba(16, 34, 47, 0.88)',
    cardBorder: 'rgba(20, 184, 166, 0.30)',

    accent: '#14b8a6',          // Luminous calm teal
    accentSoft: 'rgba(20, 184, 166, 0.18)',
    secondaryAccent: '#38bdf8',  // Sky resonance blue

    pitchFeedback: {
      inTune: '#2dd4bf',        // Radiant serene turquoise
      nearTune: '#0d9488',      // Deep teal
      offPitch: '#64748b',      // Soft slate grey (avoids red-alert cues)
    },

    motionPreset: 'sound-ripple',
    sacredGeometry: {
      type: 'sixteen-petal-lotus',
      symbol: '🌊',
    },
  },
};

export const DEFAULT_NEUTRAL_THEME: ChakraThemeConfig = {
  id: 'diabetes',
  chakraName: 'Swara',
  chakraLocation: 'Full Resonance',
  swar: 'Sa',
  mantra: 'Om',
  emotionalIntent: 'Calm mindfulness and vocal harmonization',
  bgGradient: {
    from: '#0f172a',
    via: '#1e1b4b',
    to: '#0a0f1d',
  },
  cardBg: 'rgba(30, 41, 59, 0.7)',
  cardBorder: 'rgba(99, 102, 241, 0.2)',
  accent: '#6366f1',
  accentSoft: 'rgba(99, 102, 241, 0.18)',
  secondaryAccent: '#818cf8',
  pitchFeedback: {
    inTune: '#818cf8',
    nearTune: '#6366f1',
    offPitch: '#64748b',
  },
  motionPreset: 'breathing-circle',
  sacredGeometry: {
    type: 'ten-petal-lotus',
    symbol: '🧘',
  },
};
