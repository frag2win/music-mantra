import React, { useEffect, useRef } from 'react';

interface PitchMeterProps {
  currentAccuracy: number; // 0..100
  targetNote?: string;
  targetHz?: number;
  currentNote?: string;
  currentHz?: number;
  centError?: number; // -600..600
  label?: string;
}

export const PitchMeter: React.FC<PitchMeterProps> = ({
  currentAccuracy,
  targetNote,
  targetHz,
  currentNote,
  currentHz,
  centError = 0,
  label = 'Chanting Pitch Accuracy'
}) => {
  const ariaLiveRef = useRef<HTMLDivElement>(null);
  const lastAnnouncedTime = useRef<number>(0);

  // Rate-limit aria-live announcements (max 1 announce per 2 seconds to prevent screen reader clutter)
  useEffect(() => {
    const now = Date.now();
    if (now - lastAnnouncedTime.current > 2000 && ariaLiveRef.current) {
      ariaLiveRef.current.innerText = `${label}: ${Math.round(currentAccuracy)} percent accuracy`;
      lastAnnouncedTime.current = now;
    }
  }, [currentAccuracy, label]);

  // Map cent error (-100 to +100 cents window for visual slider indicator)
  const clampedCents = Math.max(-100, Math.min(100, centError));
  // Convert -100..+100 cents to 0..100% position on gauge
  const gaugePosition = ((clampedCents + 100) / 200) * 100;

  return (
    <div className="pitch-meter card" style={{ textAlign: 'center', margin: '1rem 0' }}>
      <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>{label}</h3>

      {/* Main Accuracy Display */}
      <div style={{ fontSize: '2.5rem', fontWeight: 800, color: currentAccuracy >= 90 ? 'var(--success)' : currentAccuracy >= 75 ? 'var(--warning)' : 'var(--danger)' }}>
        {Math.round(currentAccuracy)}%
      </div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        {currentAccuracy >= 90 ? 'Target Accuracy Reached (≥90%)' : 'Align your voice to match target note'}
      </div>

      {/* Visual Cent Deviation Meter */}
      <div style={{ position: 'relative', height: '24px', background: '#334155', borderRadius: '12px', overflow: 'hidden', margin: '1rem 0' }}>
        {/* Center Target Zone (±20 cents = 90%+ accuracy) */}
        <div
          style={{
            position: 'absolute',
            left: '40%',
            width: '20%',
            height: '100%',
            background: 'rgba(34, 197, 94, 0.25)',
            borderLeft: '1px dashed var(--success)',
            borderRight: '1px dashed var(--success)'
          }}
          title="90% Accuracy Target Zone (±20 cents)"
        />
        {/* Pitch Position Indicator Pin */}
        <div
          style={{
            position: 'absolute',
            left: `${gaugePosition}%`,
            top: 0,
            bottom: 0,
            width: '6px',
            marginLeft: '-3px',
            backgroundColor: currentAccuracy >= 90 ? 'var(--success)' : 'var(--accent-primary)',
            borderRadius: '3px',
            boxShadow: '0 0 8px rgba(255,255,255,0.8)',
            transition: 'left 0.15s ease-out'
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <span>-100 cents (Flat)</span>
        <span>Target Swara (0 cents)</span>
        <span>+100 cents (Sharp)</span>
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
