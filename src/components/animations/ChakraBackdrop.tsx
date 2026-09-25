import React from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { BreathingLoop } from './BreathingLoop';
import { SunPulse } from './SunPulse';
import { RippleWave } from './RippleWave';

/**
 * ChakraBackdrop: Renders the calming therapeutic animation matching the selected condition.
 *
 * Includes an accessible user control to toggle animation intensity:
 * - Full: Rich harmonic breathing / solar / wave cycles
 * - Subtle: Soft blurred ambient pulse
 * - Off: Static calming gradient (for vestibular sensitivity / low anxiety tolerance)
 */
export interface ChakraBackdropProps {
  size?: number;
  showGuideText?: boolean;
  variant?: 'inline' | 'fullscreen';
  showIntensityControl?: boolean;
}

export const ChakraBackdrop: React.FC<ChakraBackdropProps> = ({
  size = 300,
  showGuideText,
  variant = 'inline',
  showIntensityControl = true,
}) => {
  const { theme, animationIntensity, setAnimationIntensity } = useTheme();
  const isFullscreen = variant === 'fullscreen';

  // In fullscreen mode, default guide text to false so it does not clutter behind cards
  const effectiveShowGuideText = showGuideText !== undefined ? showGuideText : !isFullscreen;

  const renderAnimation = () => {
    switch (theme.motionPreset) {
      case 'sun-pulse':
        return <SunPulse size={size} showGuideText={effectiveShowGuideText} variant={variant} />;
      case 'breathing-circle':
        return <BreathingLoop size={size} showGuideText={effectiveShowGuideText} variant={variant} />;
      case 'sound-ripple':
        return <RippleWave size={size} showGuideText={effectiveShowGuideText} variant={variant} />;
      default:
        return <BreathingLoop size={size} showGuideText={effectiveShowGuideText} variant={variant} />;
    }
  };

  if (isFullscreen) {
    return (
      <>
        {renderAnimation()}

        {/* Floating Accessible Animation Intensity Switcher in Fullscreen mode */}
        {showIntensityControl && (
          <div
            style={{
              position: 'fixed',
              bottom: '1rem',
              right: '1rem',
              zIndex: 50,
              pointerEvents: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '0.25rem 0.6rem',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
            }}
            role="group"
            aria-label="Therapeutic Animation Intensity"
          >
            <span style={{ fontWeight: 600, color: '#94a3b8' }}>Motion:</span>
            <button
              type="button"
              onClick={() => setAnimationIntensity('full')}
              style={{
                background: animationIntensity === 'full' ? theme.accent : 'transparent',
                color: animationIntensity === 'full' ? (theme.id === 'diabetes' ? '#1c1917' : '#ffffff') : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '12px',
                padding: '0.15rem 0.45rem',
                cursor: 'pointer',
                fontSize: '0.70rem',
                fontWeight: 700,
              }}
              title="Full harmonic therapeutic movement"
            >
              Flow
            </button>
            <button
              type="button"
              onClick={() => setAnimationIntensity('subtle')}
              style={{
                background: animationIntensity === 'subtle' ? theme.accent : 'transparent',
                color: animationIntensity === 'subtle' ? (theme.id === 'diabetes' ? '#1c1917' : '#ffffff') : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '12px',
                padding: '0.15rem 0.45rem',
                cursor: 'pointer',
                fontSize: '0.70rem',
                fontWeight: 700,
              }}
              title="Gentle low-amplitude movement"
            >
              Subtle
            </button>
            <button
              type="button"
              onClick={() => setAnimationIntensity('off')}
              style={{
                background: animationIntensity === 'off' ? '#475569' : 'transparent',
                color: animationIntensity === 'off' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: '12px',
                padding: '0.15rem 0.45rem',
                cursor: 'pointer',
                fontSize: '0.70rem',
                fontWeight: 700,
              }}
              title="Still static backdrop (zero vestibular movement)"
            >
              Still
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <div
      className="chakra-backdrop-inline"
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '1rem 0',
      }}
    >
      {renderAnimation()}

      {/* Accessible Animation Intensity Toggle */}
      {showIntensityControl && (
        <div
          style={{
            marginTop: '0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(15, 23, 42, 0.65)',
            padding: '0.2rem 0.6rem',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '0.72rem',
            color: 'var(--text-secondary)',
          }}
          role="group"
          aria-label="Therapeutic Animation Intensity"
        >
          <span>Motion:</span>
          <button
            type="button"
            onClick={() => setAnimationIntensity('full')}
            style={{
              background: animationIntensity === 'full' ? theme.accent : 'transparent',
              color: animationIntensity === 'full' ? (theme.id === 'diabetes' ? '#1c1917' : '#ffffff') : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '12px',
              padding: '0.15rem 0.45rem',
              cursor: 'pointer',
              fontSize: '0.72rem',
              fontWeight: 600,
            }}
          >
            Flow
          </button>
          <button
            type="button"
            onClick={() => setAnimationIntensity('subtle')}
            style={{
              background: animationIntensity === 'subtle' ? theme.accent : 'transparent',
              color: animationIntensity === 'subtle' ? (theme.id === 'diabetes' ? '#1c1917' : '#ffffff') : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '12px',
              padding: '0.15rem 0.45rem',
              cursor: 'pointer',
              fontSize: '0.72rem',
              fontWeight: 600,
            }}
          >
            Subtle
          </button>
          <button
            type="button"
            onClick={() => setAnimationIntensity('off')}
            style={{
              background: animationIntensity === 'off' ? '#475569' : 'transparent',
              color: animationIntensity === 'off' ? '#fff' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '12px',
              padding: '0.15rem 0.45rem',
              cursor: 'pointer',
              fontSize: '0.72rem',
              fontWeight: 600,
            }}
          >
            Still
          </button>
        </div>
      )}
    </div>
  );
};
