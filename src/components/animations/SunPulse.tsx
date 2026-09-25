import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

/**
 * Manipura (Solar Plexus) — Minimalist, Smooth 10-Petaled Lotus
 * Clean, serene, unhurried rotation with pure sacred geometry.
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
  const { theme, animationIntensity } = useTheme();
  const isAnimated = animationIntensity !== 'off';
  const isSubtle = animationIntensity === 'subtle';
  const isFullscreen = variant === 'fullscreen';

  // Smooth, organic 10-petal lotus path calculation
  const petals = React.useMemo(() => {
    const paths: string[] = [];
    const numPetals = 10;
    const step = 360 / numPetals;
    const tipR = 47;
    const baseR = 18;
    const w = 7.2;

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

  const fsSize = 'max(130vw, 130vh)';
  const keyId = 'manipura';
  const spinDuration = isSubtle ? 70 : 50; // Slower, calm, unhurried spin

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
      aria-label="Manipura Solar Resonance"
    >
      <style>{`
        @keyframes ${keyId}Spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes ${keyId}InlineSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ${keyId}SolarGlow {
          0%, 100% { opacity: ${isSubtle ? 0.25 : 0.40}; transform: scale(0.98); }
          50% { opacity: ${isSubtle ? 0.45 : 0.65}; transform: scale(1.02); }
        }
      `}</style>

      {/* Gentle ambient solar glow */}
      {isFullscreen && (
        <div
          className={isAnimated ? 'chakra-animated' : ''}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            background: `radial-gradient(circle at 50% 50%, ${theme.accent}35 0%, ${theme.accentSoft} 30%, transparent 68%)`,
            animation: isAnimated ? `${keyId}SolarGlow 9s ease-in-out infinite` : 'none',
            willChange: 'opacity, transform',
          }}
        />
      )}

      {/* Clean, smoothly rotating 10-petal chakra */}
      <div
        className={isAnimated ? 'chakra-animated' : ''}
        style={{
          position: 'absolute',
          top: isFullscreen ? '50%' : '5%',
          left: isFullscreen ? '50%' : '5%',
          width: isFullscreen ? fsSize : '90%',
          height: isFullscreen ? fsSize : '90%',
          transform: isFullscreen ? 'translate(-50%, -50%)' : 'none',
          animation: isAnimated
            ? `${isFullscreen ? `${keyId}Spin` : `${keyId}InlineSpin`} ${spinDuration}s linear infinite`
            : 'none',
          willChange: 'transform',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          style={{ opacity: isFullscreen ? (isSubtle ? 0.22 : 0.38) : 0.65 }}
          aria-hidden="true"
        >
          {/* Outer Thin Halo Ring */}
          <circle cx="50" cy="50" r="48" fill="none" stroke={theme.accent} strokeWidth="0.4" opacity="0.45" />

          {/* 10 Smooth Lotus Petals */}
          {petals.map((d, i) => (
            <path
              key={`petal-${i}`}
              d={d}
              fill={`${theme.accent}16`}
              stroke={theme.accent}
              strokeWidth={isFullscreen ? '0.5' : '0.9'}
              strokeLinejoin="round"
            />
          ))}

          {/* Inner Lotus Ring */}
          <circle cx="50" cy="50" r="18" fill="none" stroke={theme.accent} strokeWidth="0.6" opacity="0.8" />
          <circle cx="50" cy="50" r="15" fill="none" stroke={theme.secondaryAccent} strokeWidth="0.35" opacity="0.5" />

          {/* Clean Central Sacred Geometry: Agni Triangle */}
          <polygon
            points="37,42 63,42 50,64"
            fill={`${theme.accent}20`}
            stroke={theme.accent}
            strokeWidth={isFullscreen ? '0.6' : '1.0'}
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
          <div style={{ fontSize: '1.1rem', marginBottom: '0.15rem' }}>☀️</div>
          <div style={{ fontWeight: 700 }}>Manipura Solar Resonance</div>
          <div style={{ fontSize: '0.72rem', color: '#fde68a', marginTop: '0.15rem' }}>
            {animationIntensity === 'off' ? 'Still Backdrop' : 'Grounded Warmth · Swara Ga'}
          </div>
        </div>
      )}
    </div>
  );
};
