import React from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { WaveIcon } from '../common/Icons';

/**
 * Vishuddha (Throat Chakra) — Mathematically Symmetric 16-Petaled Lotus
 * Pure sacred geometry:
 * - 100% equilateral downward Akasha triangle centered precisely at (50, 50)
 * - Concentric lunar circle and bindu core centered precisely at (50, 50)
 * - Identical master petal replicated across 16 exact 22.5-degree rotational increments
 * - Rich color gradients (accent to accentDark) and mystical deep corner vignette
 */
export interface RippleWaveProps {
  size?: number;
  showGuideText?: boolean;
  variant?: 'inline' | 'fullscreen';
}

export const RippleWave: React.FC<RippleWaveProps> = ({
  size = 320,
  showGuideText = true,
  variant = 'inline',
}) => {
  const { theme } = useTheme();
  const isFullscreen = variant === 'fullscreen';

  const accentDark = theme.accentDark || '#0a2c2b';
  const cornerDark = theme.cornerDark || '#010204';

  // Master petal path centered on vertical midline x=50, perfectly symmetric:
  // Base at (50, 32), smooth bilateral curve out to (54.8, 30) and (53.6, 13.5), tapering to tip at (50, 3.5)
  const masterPetalD = 'M 50 32 C 54.8 30, 53.6 13.5, 50 3.5 C 46.4 13.5, 45.2 30, 50 32 Z';

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
      aria-label="Vishuddha Acoustic Waves"
    >
      {/* Corner darkening vignette for deep mystical ambiance */}
      {isFullscreen && <div className="chakra-corner-vignette" aria-hidden="true" />}

      {/* Gentle acoustic ripple wave */}
      {isFullscreen &&
        [0, 1].map((i) => (
          <div
            key={`ripple-${i}`}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 'min(70vw, 70vh)',
              height: 'min(70vw, 70vh)',
              borderRadius: '50%',
              border: `1.2px solid ${i === 1 ? theme.secondaryAccent : theme.accent}35`,
              transform: 'translate(-50%, -50%) scale(0.2)',
              animation: 'vishuddhaAcousticRipple 6s cubic-bezier(0.1, 0.4, 0.3, 1) infinite',
              animationDelay: `${i * 3}s`,
              willChange: 'transform, opacity',
              zIndex: 0,
            }}
          />
        ))}

      {/* Gentle ambient teal glow */}
      {isFullscreen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            background: `radial-gradient(circle at 50% 50%, ${theme.accent}28 0%, ${theme.accentSoft} 24%, transparent 65%)`,
            opacity: 0.55,
            zIndex: 0,
          }}
        />
      )}

      {/* Clean, smoothly rotating 16-petal chakra — guaranteed continuous slow rotation via global CSS */}
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
            {/* Petal Fill Gradient: calm teal to deep ocean shadow */}
            <linearGradient id="vishuddhaPetalFill" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={accentDark} stopOpacity="0.45" />
              <stop offset="50%" stopColor={theme.accent} stopOpacity="0.22" />
              <stop offset="100%" stopColor={accentDark} stopOpacity="0.55" />
            </linearGradient>

            {/* Petal Stroke Gradient */}
            <linearGradient id="vishuddhaPetalStroke" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor={theme.accent} stopOpacity="0.9" />
              <stop offset="55%" stopColor={theme.accent} stopOpacity="0.7" />
              <stop offset="100%" stopColor={accentDark} stopOpacity="0.5" />
            </linearGradient>

            {/* Downward Triangle Gradient */}
            <radialGradient id="vishuddhaTriangleFill" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={theme.accent} stopOpacity="0.26" />
              <stop offset="85%" stopColor={accentDark} stopOpacity="0.12" />
              <stop offset="100%" stopColor={accentDark} stopOpacity="0.04" />
            </radialGradient>

            {/* Outer Halo Fade Gradient */}
            <radialGradient id="vishuddhaHaloGrad" cx="50%" cy="50%" r="50%">
              <stop offset="85%" stopColor={theme.accent} stopOpacity="0.5" />
              <stop offset="100%" stopColor={accentDark} stopOpacity="0.2" />
            </radialGradient>

            {/* Central Bindu Core Gradient */}
            <radialGradient id="vishuddhaBinduGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="45%" stopColor={theme.accent} stopOpacity="0.9" />
              <stop offset="100%" stopColor={accentDark} stopOpacity="0.8" />
            </radialGradient>
          </defs>

          {/* Outer Thin Halo Rings */}
          <circle cx="50" cy="50" r="48" fill="none" stroke="url(#vishuddhaHaloGrad)" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="46.5" fill="none" stroke={theme.accent} strokeWidth="0.2" opacity="0.3" strokeDasharray="1 2" />

          {/* 16 Mathematically Identical Lotus Petals rotated with 22.5-degree symmetry */}
          {Array.from({ length: 16 }).map((_, i) => (
            <g key={`petal-${i}`} transform={`rotate(${i * 22.5}, 50, 50)`}>
              <path
                d={masterPetalD}
                fill="url(#vishuddhaPetalFill)"
                stroke="url(#vishuddhaPetalStroke)"
                strokeWidth={isFullscreen ? '0.55' : '0.9'}
                strokeLinejoin="round"
              />
            </g>
          ))}

          {/* Inner Lotus Rings */}
          <circle cx="50" cy="50" r="19" fill="none" stroke={theme.accent} strokeWidth="0.6" opacity="0.8" />
          <circle cx="50" cy="50" r="16" fill="none" stroke={theme.secondaryAccent} strokeWidth="0.35" opacity="0.5" />

          {/* Mathematically Exact Equilateral Akasha Triangle (circumradius R = 15.5, center = 50, 50) */}
          {/* Bottom vertex at (50, 65.5), top corners at (63.423, 42.25) and (36.577, 42.25) */}
          <polygon
            points="50,65.5 63.423,42.25 36.577,42.25"
            fill="url(#vishuddhaTriangleFill)"
            stroke={theme.accent}
            strokeWidth={isFullscreen ? '0.55' : '1.0'}
            strokeLinejoin="round"
          />

          {/* Concentric Lunar Circle and Bindu Core (centered at 50, 50) */}
          <circle cx="50" cy="50" r="6" fill="none" stroke={theme.secondaryAccent} strokeWidth="0.5" opacity="0.8" />
          <circle cx="50" cy="50" r="3.2" fill="url(#vishuddhaBinduGrad)" />
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
            <WaveIcon size={20} color={theme.accent} />
          </div>
          <div style={{ fontWeight: 700 }}>Vishuddha Sound Waves</div>
          <div style={{ fontSize: '0.72rem', color: '#a5f3fc', marginTop: '0.15rem' }}>
            Acoustic Ripples · Swara Pa
          </div>
        </div>
      )}
    </div>
  );
};
