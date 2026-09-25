import React, { useEffect, useRef } from 'react';
import { useOptionalTheme } from '../../theme/ThemeContext';
import { TargetIcon, StarIcon, MicIcon, ArrowUpIcon, ArrowDownIcon } from './Icons';

interface PitchMeterProps {
  currentAccuracy: number; // 0..100
  targetNote?: string;
  targetHz?: number;
  currentNote?: string;
  currentHz?: number;
  centError?: number; // -600..600
  label?: string;
  therapistTip?: string;
}

export const PitchMeter: React.FC<PitchMeterProps> = ({
  currentAccuracy,
  targetNote,
  targetHz,
  currentNote,
  currentHz,
  centError = 0,
  label = 'Chanting Pitch Accuracy',
  therapistTip
}) => {
  const themeContext = useOptionalTheme();
  const theme = themeContext?.theme;
  const ariaLiveRef = useRef<HTMLDivElement>(null);
  const lastAnnouncedTime = useRef<number>(0);

  // Musician-Therapist Fluid Needle Damper
  // Dampens sudden volume spikes and pitch pops into a silky, calm 60fps movement
  const [smoothGaugePos, setSmoothGaugePos] = React.useState<number>(50);
  const targetPosRef = useRef<number>(50);
  const currentPosRef = useRef<number>(50);
  const animFrameRef = useRef<number | null>(null);

  // Update target position based on vocal input
  useEffect(() => {
    if (!currentHz || currentAccuracy === 0) {
      // Resting / unvoiced: gently drift needle home to center
      targetPosRef.current = 50;
    } else {
      const clampedCents = Math.max(-100, Math.min(100, centError));
      // Convert -100..+100 cents to 0..100% position on gauge
      targetPosRef.current = ((clampedCents + 100) / 200) * 100;
    }
  }, [centError, currentHz, currentAccuracy]);

  // Continuous animation frame lerp for liquid-smooth motion
  useEffect(() => {
    let isRunning = true;
    const updateMotion = () => {
      if (!isRunning) return;

      const current = currentPosRef.current;
      const target = targetPosRef.current;
      const delta = target - current;

      if (Math.abs(delta) < 0.08) {
        currentPosRef.current = target;
      } else {
        // Musician-Therapist Damping:
        // ~14% step per frame = silky glide, immune to momentary loudness pops
        currentPosRef.current = current + delta * 0.14;
      }

      setSmoothGaugePos(currentPosRef.current);
      animFrameRef.current = requestAnimationFrame(updateMotion);
    };

    animFrameRef.current = requestAnimationFrame(updateMotion);

    return () => {
      isRunning = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Rate-limit aria-live announcements (max 1 announce per 2 seconds to prevent screen reader clutter)
  useEffect(() => {
    const now = Date.now();
    if (now - lastAnnouncedTime.current > 2000 && ariaLiveRef.current) {
      ariaLiveRef.current.innerText = `${label}: ${Math.round(currentAccuracy)} percent accuracy`;
      lastAnnouncedTime.current = now;
    }
  }, [currentAccuracy, label]);

  // Calming Chromotherapy Palette (avoids commonly cited red-alert stress cues)
  const inTuneColor = theme?.pitchFeedback.inTune || 'var(--chakra-pitch-in-tune, #10b981)';
  const nearTuneColor = theme?.pitchFeedback.nearTune || 'var(--chakra-pitch-near-tune, #f59e0b)';
  const offPitchColor = theme?.pitchFeedback.offPitch || 'var(--chakra-pitch-off-pitch, #78716c)';

  const activeColor =
    currentAccuracy >= 90
      ? inTuneColor
      : currentAccuracy >= 70
        ? nearTuneColor
        : offPitchColor;

  // Accessibility: State classification independent of color (distinguishable under deuteranopia/protanopia)
  const isResonant = currentAccuracy >= 90;
  const isNear = currentAccuracy >= 70 && !isResonant;
  const isFlat = centError < -20;
  const isSharp = centError > 20;

  const statusBadge = isResonant
    ? { icon: <StarIcon size={14} filled />, label: 'IN TUNE', desc: 'Resonance Lock Reached (≥90%)' }
    : isNear
      ? { icon: <TargetIcon size={14} />, label: 'NEAR TUNE', desc: 'Approaching Resonance — Steady Breath' }
      : isFlat
        ? { icon: <ArrowUpIcon size={14} />, label: 'FLAT', desc: 'Gently Raise Pitch Upward' }
        : isSharp
          ? { icon: <ArrowDownIcon size={14} />, label: 'SHARP', desc: 'Gently Ease Pitch Downward' }
          : { icon: <MicIcon size={14} />, label: 'ADJUSTING', desc: 'Sing Into Microphone' };

  return (
    <div className="pitch-meter card" style={{ textAlign: 'center', margin: '1rem 0' }}>
      <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{label}</h3>

      {/* Main Accuracy Display with sound-reactive glow */}
      <div
        style={{
          fontSize: '2.6rem',
          fontWeight: 800,
          color: activeColor,
          textShadow: isResonant ? `0 0 20px ${inTuneColor}` : 'none',
          transition: 'color 0.3s ease, text-shadow 0.3s ease',
        }}
      >
        {Math.round(currentAccuracy)}%
      </div>

      {/* Accessible Non-Color-Sole Status Pill (Protanopia/Deuteranopia & Grayscale Safe) */}
      <div style={{ margin: '0.25rem 0 0.75rem 0' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: 800,
            letterSpacing: '0.75px',
            background: isResonant
              ? inTuneColor
              : isNear
                ? 'rgba(245, 158, 11, 0.22)'
                : 'rgba(100, 116, 139, 0.3)',
            color: isResonant
              ? (theme?.id === 'diabetes' ? '#1c1917' : '#ffffff')
              : isNear
                ? '#fde68a'
                : '#f1f5f9',
            border: isResonant
              ? `1px solid ${inTuneColor}`
              : isNear
                ? `1px dashed ${nearTuneColor}`
                : '1px solid #94a3b8',
            boxShadow: isResonant ? `0 0 10px ${inTuneColor}55` : 'none',
          }}
          aria-label={`Pitch status: ${statusBadge.label}`}
        >
          <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center' }}>{statusBadge.icon}</span>
          <span>[{statusBadge.label}]</span>
        </span>
      </div>

      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        {statusBadge.desc}
      </div>

      {/* Visual Cent Deviation Meter */}
      <div
        style={{
          position: 'relative',
          height: '28px',
          background: 'rgba(15, 23, 42, 0.85)',
          borderRadius: '14px',
          overflow: 'hidden',
          margin: '1rem 0',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Center Target Zone (±20 cents = 90%+ accuracy) */}
        <div
          style={{
            position: 'absolute',
            left: '40%',
            width: '20%',
            height: '100%',
            background: `${inTuneColor}22`,
            borderLeft: `2px dashed ${inTuneColor}`,
            borderRight: `2px dashed ${inTuneColor}`,
            transition: 'background 0.3s ease',
          }}
          title="90% Accuracy Target Zone (±20 cents)"
        />

        {/* Center 0 cents line */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: '1px',
            background: 'rgba(255, 255, 255, 0.4)',
          }}
        />

        {/* Pitch Position Indicator Pin with Sound-Reactive Glow & Diamond Marker */}
        <div
          style={{
            position: 'absolute',
            left: `${smoothGaugePos}%`,
            top: 0,
            bottom: 0,
            width: '8px',
            marginLeft: '-4px',
            backgroundColor: activeColor,
            borderRadius: '4px',
            border: '1px solid #ffffff',
            opacity: currentHz ? 1 : 0.45,
            boxShadow:
              isResonant
                ? `0 0 16px ${inTuneColor}, 0 0 6px #ffffff`
                : isNear
                  ? `0 0 10px ${nearTuneColor}`
                  : '0 0 4px rgba(255,255,255,0.4)',
            transition: 'background-color 0.25s ease, box-shadow 0.25s ease, opacity 0.3s ease',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <span>-100¢ [FLAT]</span>
        <span style={{ color: isResonant ? activeColor : 'var(--text-primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <TargetIcon size={14} /> Target Swara [0¢]
        </span>
        <span>+100¢ [SHARP]</span>
      </div>

      {/* Real-time Directional Coaching (avoids red alert stress cues) */}
      <div
        style={{
          marginTop: '1rem',
          padding: '0.85rem 1rem',
          borderRadius: '10px',
          background:
            isResonant
              ? `${inTuneColor}22`
              : isNear
                ? `${nearTuneColor}18`
                : 'rgba(51, 65, 85, 0.55)',
          border: `1px solid ${
            isResonant
              ? `${inTuneColor}88`
              : isNear
                ? `${nearTuneColor}77`
                : 'rgba(148, 163, 184, 0.4)'
          }`,
          fontSize: '0.95rem',
          fontWeight: 600,
          color:
            isResonant
              ? (theme?.id === 'diabetes' ? '#fde68a' : inTuneColor)
              : isNear
                ? nearTuneColor
                : '#f1f5f9',
          transition: 'all 0.3s ease',
        }}
      >
        {currentHz ? (
          isResonant ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <StarIcon size={16} filled /> Harmonic Lock! Resonating smoothly with the target swara.
            </span>
          ) : isFlat ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <ArrowUpIcon size={15} /> Pitch is flat. Raise your vocal tone gently upward.
            </span>
          ) : isSharp ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <ArrowDownIcon size={15} /> Pitch is sharp. Ease your vocal tone gently downward.
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <TargetIcon size={15} /> Almost in tune! Steady your breath in the target zone.
            </span>
          )
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <MicIcon size={16} /> Chant the mantra into your microphone to begin feedback...
          </span>
        )}

        {therapistTip && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#cbd5e1', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.4rem' }}>
            Therapist Guidance: {therapistTip}
          </div>
        )}
      </div>

      {/* Detailed pitch metadata */}
      {(targetNote || currentNote) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', background: '#0f172a', padding: '0.75rem', borderRadius: '8px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TARGET NOTE</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{targetNote || '--'}</div>
            {targetHz && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{targetHz.toFixed(1)} Hz</div>}
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>YOUR SUNG NOTE</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: currentNote ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
              {currentNote || 'Singing...'}
            </div>
            {currentHz ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {currentHz.toFixed(1)} Hz ({centError > 0 ? `+${centError.toFixed(0)}` : centError.toFixed(0)} cents)
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>--</div>
            )}
          </div>
        </div>
      )}

      {/* Rate-limited aria-live region for accessibility */}
      <div ref={ariaLiveRef} aria-live="polite" className="sr-only" />
    </div>
  );
};
