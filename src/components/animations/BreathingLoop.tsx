import React from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { LeafIcon } from '../common/Icons';

/**
 * Anahata (Heart Chakra / Neutral Swara) — Mathematically Symmetric 12-Petaled Lotus
 * Pure sacred geometry:
 * - 100% equilateral, concentric Shatkona (hexagram) with identical circumradii and center (50, 50)
 * - Identical master petal replicated across 12 exact 30-degree rotational increments
 * - Rich color gradients (accent to accentDark) and mystical deep corner vignette
 */
export interface BreathingLoopProps {
  size?: number;
  showGuideText?: boolean;
  variant?: 'inline' | 'fullscreen';
}

export const BreathingLoop: React.FC<BreathingLoopProps> = ({
  size = 320,
  showGuideText = true,
  variant = 'inline',
}) => {
  const { theme } = useTheme();
  const isFullscreen = variant === 'fullscreen';

  const accentDark = theme.accentDark || '#181242';
  const cornerDark = theme.cornerDark || '#010204';

  // Master petal path centered on vertical midline x=50, perfectly symmetric:
  // Base at (50, 32), smooth bilateral curve out to (56.5, 30) and (55.2, 13.5), tapering to tip at (50, 3.5)
  const masterPetalD = 'M 50 32 C 56.5 30, 55.2 13.5, 50 3.5 C 44.8 13.5, 43.5 30, 50 32 Z';

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
      aria-label="Anahata Breath Guide"
    >
      {/* Corner darkening vignette for deep mystical ambiance */}
      {isFullscreen && <div className="chakra-corner-vignette" aria-hidden="true" />}

      {/* Gentle ambient breathing glow (4s Inhale, 1s Hold, 6s Exhale) */}
      {isFullscreen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            background: `radial-gradient(circle at 50% 50%, ${theme.accent}30 0%, ${theme.accentSoft} 28%, transparent 65%)`,
            animation: 'anahataBreathCycle 11s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            willChange: 'opacity, transform',
            zIndex: 0,
          }}
        />
      )}

      {/* Clean, smoothly rotating 12-petal chakra — guaranteed continuous slow rotation via global CSS */}
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
            {/* Petal Fill Gradient: accent to deep accentDark shade */}
            <linearGradient id="anahataPetalFill" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={accentDark} stopOpacity="0.45" />
              <stop offset="50%" stopColor={theme.accent} stopOpacity="0.22" />
              <stop offset="100%" stopColor={accentDark} stopOpacity="0.55" />
            </linearGradient>

            {/* Petal Stroke Gradient: glowing accent to darker edge */}
            <linearGradient id="anahataPetalStroke" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={theme.accent} stopOpacity="0.9" />
              <stop offset="55%" stopColor={theme.accent} stopOpacity="0.7" />
              <stop offset="100%" stopColor={accentDark} stopOpacity="0.5" />
            </linearGradient>

            {/* Upward Triangle Gradient (Shiva / Consciousness) */}
            <radialGradient id="shatkonaUpFill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={theme.accent} stopOpacity="0.26" />
              <stop offset="85%" stopColor={accentDark} stopOpacity="0.12" />
              <stop offset="100%" stopColor={accentDark} stopOpacity="0.04" />
            </radialGradient>

            {/* Downward Triangle Gradient (Shakti / Manifestation) */}
            <radialGradient id="shatkonaDownFill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={theme.secondaryAccent} stopOpacity="0.24" />
              <stop offset="85%" stopColor={accentDark} stopOpacity="0.12" />
              <stop offset="100%" stopColor={accentDark} stopOpacity="0.04" />
            </radialGradient>

            {/* Outer Halo Fade Gradient */}
            <radialGradient id="haloStrokeGrad" cx="50%" cy="50%" r="50%">
              <stop offset="85%" stopColor={theme.accent} stopOpacity="0.5" />
              <stop offset="100%" stopColor={accentDark} stopOpacity="0.2" />
            </radialGradient>

            {/* Central Bindu Core Gradient */}
            <radialGradient id="binduGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="45%" stopColor={theme.accent} stopOpacity="0.9" />
              <stop offset="100%" stopColor={accentDark} stopOpacity="0.8" />
            </radialGradient>
          </defs>

          {/* Outer Halo Rings */}
          <circle cx="50" cy="50" r="48" fill="none" stroke="url(#haloStrokeGrad)" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="46.5" fill="none" stroke={theme.accent} strokeWidth="0.2" opacity="0.3" strokeDasharray="1 2" />

          {/* 12 Mathematically Identical Lotus Petals rotated with 30-degree symmetry */}
          {Array.from({ length: 12 }).map((_, i) => (
            <g key={`petal-${i}`} transform={`rotate(${i * 30}, 50, 50)`}>
              <path
                d={masterPetalD}
                fill="url(#anahataPetalFill)"
                stroke="url(#anahataPetalStroke)"
                strokeWidth={isFullscreen ? '0.55' : '0.9'}
                strokeLinejoin="round"
              />
            </g>
          ))}

          {/* Inner Lotus Rings */}
          <circle cx="50" cy="50" r="18" fill="none" stroke={theme.accent} strokeWidth="0.6" opacity="0.8" />
          <circle cx="50" cy="50" r="15" fill="none" stroke={theme.secondaryAccent} strokeWidth="0.35" opacity="0.5" />

          {/* Mathematically Exact Shatkona: Two Equilateral Concentric Triangles (R = 21, center = 50, 50) */}
          {/* Upward Triangle: top at (50, 29), base corners at (68.187, 60.5) and (31.813, 60.5) */}
          <polygon
            points="50,29 68.187,60.5 31.813,60.5"
            fill="url(#shatkonaUpFill)"
            stroke={theme.accent}
            strokeWidth={isFullscreen ? '0.55' : '1.0'}
            strokeLinejoin="round"
          />
          {/* Downward Triangle: bottom at (50, 71), top corners at (68.187, 39.5) and (31.813, 39.5) */}
          <polygon
            points="50,71 68.187,39.5 31.813,39.5"
            fill="url(#shatkonaDownFill)"
            stroke={theme.secondaryAccent}
            strokeWidth={isFullscreen ? '0.55' : '1.0'}
            strokeLinejoin="round"
          />

          {/* Concentric Center Hexagon Accent Ring */}
          <circle cx="50" cy="50" r="7.5" fill="none" stroke={theme.accent} strokeWidth="0.3" opacity="0.4" />

          {/* Central Bindu Core */}
          <circle cx="50" cy="50" r="3.2" fill="url(#binduGrad)" />
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
            <LeafIcon size={20} color={theme.accent} />
          </div>
          <div style={{ fontWeight: 700 }}>Anahata Breath</div>
          <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginTop: '0.15rem' }}>
            4s Inhale · 1s Hold · 6s Exhale
          </div>
        </div>
      )}
    </div>
  );
};
