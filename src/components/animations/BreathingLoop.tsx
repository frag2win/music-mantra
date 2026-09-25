import React from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { LeafIcon } from '../common/Icons';

/**
 * Anahata (Heart Chakra) — Minimalist, Smooth 12-Petaled Lotus
 * Clean, serene, unhurried rotation with sacred Shatkona (hexagram).
 * 4-1-6 therapeutic breathing cadence on the soft ambient glow.
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

  // Smooth, organic 12-petal lotus path calculation
  const petals = React.useMemo(() => {
    const paths: string[] = [];
    const numPetals = 12;
    const step = 360 / numPetals;
    const tipR = 47;
    const baseR = 18;
    const w = 6.2;

    for (let i = 0; i < numPetals; i++) {
      const a = (i * step * Math.PI) / 180;
      const perp = a + Math.PI / 2;

      const tx = 50 + tipR * Math.sin(a);
      const ty = 50 - tipR * Math.cos(a);

      const b1x = 50 + baseR * Math.sin(a) + w * 0.3 * Math.sin(perp);
      const b1y = 50 - baseR * Math.cos(a) - w * 0.3 * Math.cos(perp);
      const b2x = 50 + baseR * Math.sin(a) - w * 0.3 * Math.sin(perp);
      const b2y = 50 - baseR * Math.cos(a) + w * 0.3 * Math.cos(perp);

      // Smooth curvature control points
      const cp1x = 50 + (baseR + 8) * Math.sin(a) + w * Math.sin(perp);
      const cp1y = 50 - (baseR + 8) * Math.cos(a) - w * Math.cos(perp);
      const cp2x = 50 + (tipR - 6) * Math.sin(a) + w * 0.5 * Math.sin(perp);
      const cp2y = 50 - (tipR - 6) * Math.cos(a) - w * 0.5 * Math.cos(perp);

      const cp3x = 50 + (tipR - 6) * Math.sin(a) - w * 0.5 * Math.sin(perp);
      const cp3y = 50 - (tipR - 6) * Math.cos(a) + w * 0.5 * Math.cos(perp);
      const cp4x = 50 + (baseR + 8) * Math.sin(a) - w * Math.sin(perp);
      const cp4y = 50 - (baseR + 8) * Math.cos(a) + w * Math.cos(perp);

      paths.push(
        `M ${b1x.toFixed(2)} ${b1y.toFixed(2)} C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${tx.toFixed(2)} ${ty.toFixed(2)} C ${cp3x.toFixed(2)} ${cp3y.toFixed(2)}, ${cp4x.toFixed(2)} ${cp4y.toFixed(2)}, ${b2x.toFixed(2)} ${b2y.toFixed(2)} Z`
      );
    }
    return paths;
  }, []);

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
              background: `radial-gradient(ellipse at center, ${theme.bgGradient.from} 0%, ${theme.bgGradient.via} 50%, ${theme.bgGradient.to} 100%)`,
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
      {/* Gentle ambient breathing glow (4s Inhale, 1s Hold, 6s Exhale) */}
      {isFullscreen && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            background: `radial-gradient(circle at 50% 50%, ${theme.accent}35 0%, ${theme.accentSoft} 30%, transparent 68%)`,
            animation: 'anahataBreathCycle 11s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            willChange: 'opacity, transform',
          }}
        />
      )}

      {/* Clean, smoothly rotating 12-petal chakra — guaranteed continuous rotation via global CSS */}
      <div
        className={isFullscreen ? 'chakra-spin-fullscreen' : 'chakra-spin-inline'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          style={{ opacity: isFullscreen ? 0.38 : 0.65 }}
          aria-hidden="true"
        >
          {/* Outer Thin Halo Ring */}
          <circle cx="50" cy="50" r="48" fill="none" stroke={theme.accent} strokeWidth="0.4" opacity="0.45" />

          {/* 12 Smooth Lotus Petals */}
          {petals.map((d, i) => (
            <path
              key={`petal-${i}`}
              d={d}
              fill={`${theme.accent}16`}
              stroke={theme.accent}
              strokeWidth={isFullscreen ? '0.55' : '0.9'}
              strokeLinejoin="round"
            />
          ))}

          {/* Inner Lotus Ring */}
          <circle cx="50" cy="50" r="18" fill="none" stroke={theme.accent} strokeWidth="0.6" opacity="0.8" />
          <circle cx="50" cy="50" r="15" fill="none" stroke={theme.secondaryAccent} strokeWidth="0.35" opacity="0.5" />

          {/* Clean Central Sacred Shatkona: Two Interlocking Triangles */}
          {/* Upward Triangle (Shiva / Consciousness) */}
          <polygon
            points="50,30 67,59 33,59"
            fill={`${theme.accent}16`}
            stroke={theme.accent}
            strokeWidth={isFullscreen ? '0.55' : '1.0'}
            strokeLinejoin="round"
          />
          {/* Downward Triangle (Shakti / Manifestation) */}
          <polygon
            points="50,66 67,37 33,37"
            fill={`${theme.secondaryAccent}14`}
            stroke={theme.secondaryAccent}
            strokeWidth={isFullscreen ? '0.55' : '1.0'}
            strokeLinejoin="round"
          />

          {/* Central Bindu Core */}
          <circle cx="50" cy="50" r="3.2" fill={theme.accent} opacity="0.9" />
          <circle cx="50" cy="50" r="1.2" fill="#ffffff" opacity="0.95" />
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
