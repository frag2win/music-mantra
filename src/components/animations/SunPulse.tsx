import React from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { SunIcon } from '../common/Icons';

/**
 * Manipura (Solar Plexus) — Mathematically Symmetric 10-Petaled Lotus
 * Pure sacred geometry:
 * - 100% equilateral Agni triangle centered precisely at (50, 50)
 * - Identical master petal replicated across 10 exact 36-degree rotational increments
 * - Rich color gradients (accent to accentDark) and mystical deep corner vignette
 */
export interface SunPulseProps {
  size?: number;
  showGuideText?: boolean;
  variant?: 'inline' | 'fullscreen';
}

export const SunPulse: React.FC<SunPulseProps> = ({
  size = 320,
  showGuideText = true,
  variant = 'inline',
}) => {
  const { theme } = useTheme();
  const isFullscreen = variant === 'fullscreen';

  const accentDark = theme.accentDark || '#4a1d04';
  const cornerDark = theme.cornerDark || '#010204';

  // Master petal path centered on vertical midline x=50, perfectly symmetric:
  // Base at (50, 32), smooth bilateral curve out to (57.2, 30) and (55.8, 13.5), tapering to tip at (50, 3.5)
  const masterPetalD = 'M 50 32 C 57.2 30, 55.8 13.5, 50 3.5 C 44.2 13.5, 42.8 30, 50 32 Z';

  return (
    <div
      style={
        isFullscreen
          ? {
              position: 'fixed',
              inset: 0,
              width: '100vw',
              height: '100vh',
              zIndex: -1,
              pointerEvents: 'none',
              overflow: 'hidden',
              background: `radial-gradient(ellipse at 50% 50%, ${theme.bgGradient.from} 0%, ${theme.bgGradient.via} 38%, ${theme.bgGradient.to} 70%, ${cornerDark} 100%)`,
            }
          : {
              position: 'relative',
              width: size,
              height: size,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }
      }
      aria-label="Manipura Solar Resonance"
    >
      {/* Corner darkening vignette for deep mystical ambiance */}
      {isFullscreen && <div className="chakra-corner-vignette" aria-hidden="true" />}

      {/* Gentle ambient solar glow */}
      {isFullscreen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            background: `radial-gradient(circle at 50% 50%, ${theme.accent}32 0%, ${theme.accentSoft} 26%, transparent 65%)`,
            animation: 'chakraAmbientGlow 9s ease-in-out infinite',
            willChange: 'opacity, transform',
            zIndex: 0,
          }}
        />
      )}

      {/* Clean, smoothly rotating 10-petal chakra — guaranteed continuous slow rotation via global CSS */}
      <div
        className={isFullscreen ? 'chakra-spin-fullscreen' : 'chakra-spin-inline'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          style={{ opacity: isFullscreen ? 0.42 : 0.72 }}
          aria-hidden="true"
        >
          <defs>
            {/* Petal Fill Gradient: warm amber to deep shadow amber */}
            <linearGradient id="manipuraPetalFill" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={accentDark} stopOpacity="0.45" />
              <stop offset="50%" stopColor={theme.accent} stopOpacity="0.22" />
              <stop offset="100%" stopColor={accentDark} stopOpacity="0.55" />
            </linearGradient>

            {/* Petal Stroke Gradient */}
            <linearGradient id="manipuraPetalStroke" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={theme.accent} stopOpacity="0.9" />
              <stop offset="55%" stopColor={theme.accent} stopOpacity="0.7" />
              <stop offset="100%" stopColor={accentDark} stopOpacity="0.5" />
            </linearGradient>

            {/* Agni Triangle Gradient */}
            <radialGradient id="agniTriangleFill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={theme.accent} stopOpacity="0.30" />
              <stop offset="80%" stopColor={accentDark} stopOpacity="0.14" />
              <stop offset="100%" stopColor={accentDark} stopOpacity="0.05" />
            </radialGradient>

            {/* Outer Halo Fade Gradient */}
            <radialGradient id="sunHaloGrad" cx="50%" cy="50%" r="50%">
              <stop offset="85%" stopColor={theme.accent} stopOpacity="0.5" />
              <stop offset="100%" stopColor={accentDark} stopOpacity="0.2" />
            </radialGradient>

            {/* Central Bindu Core Gradient */}
            <radialGradient id="sunBinduGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="45%" stopColor={theme.accent} stopOpacity="0.9" />
              <stop offset="100%" stopColor={accentDark} stopOpacity="0.8" />
            </radialGradient>
          </defs>

          {/* Outer Thin Halo Rings */}
          <circle cx="50" cy="50" r="48" fill="none" stroke="url(#sunHaloGrad)" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="46.5" fill="none" stroke={theme.accent} strokeWidth="0.2" opacity="0.3" strokeDasharray="1 2" />

          {/* 10 Mathematically Identical Lotus Petals rotated with 36-degree symmetry */}
          {Array.from({ length: 10 }).map((_, i) => (
            <g key={`petal-${i}`} transform={`rotate(${i * 36}, 50, 50)`}>
              <path
                d={masterPetalD}
                fill="url(#manipuraPetalFill)"
                stroke="url(#manipuraPetalStroke)"
                strokeWidth={isFullscreen ? '0.55' : '0.9'}
                strokeLinejoin="round"
              />
            </g>
          ))}

          {/* Inner Lotus Rings */}
          <circle cx="50" cy="50" r="18" fill="none" stroke={theme.accent} strokeWidth="0.6" opacity="0.8" />
          <circle cx="50" cy="50" r="15" fill="none" stroke={theme.secondaryAccent} strokeWidth="0.35" opacity="0.5" />

          {/* Mathematically Exact Equilateral Agni Triangle (circumradius R = 17, center = 50, 50) */}
          {/* Bottom vertex at (50, 67), top corners at (64.722, 41.5) and (35.278, 41.5) */}
          <polygon
            points="50,67 64.722,41.5 35.278,41.5"
            fill="url(#agniTriangleFill)"
            stroke={theme.accent}
            strokeWidth={isFullscreen ? '0.6' : '1.0'}
            strokeLinejoin="round"
          />

          {/* Concentric Inner Triangle Accent Ring */}
          <circle cx="50" cy="50" r="6" fill="none" stroke={theme.accent} strokeWidth="0.3" opacity="0.4" />

          {/* Central Bindu Core */}
          <circle cx="50" cy="50" r="3.2" fill="url(#sunBinduGrad)" />
          <circle cx="50" cy="50" r="1.1" fill="#ffffff" opacity="0.95" />
        </svg>
      </div>

      {showGuideText && (
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#f8fafc',
            textAlign: 'center',
            background: 'rgba(15,23,42,0.85)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            padding: '0.5rem 1rem',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.25rem' }}>
            <SunIcon size={20} color={theme.accent} />
          </div>
          <div style={{ fontWeight: 700 }}>Manipura Solar Resonance</div>
          <div style={{ fontSize: '0.72rem', color: '#fde68a', marginTop: '0.15rem' }}>
            Grounded Warmth · Swara Ga
          </div>
        </div>
      )}
    </div>
  );
};
