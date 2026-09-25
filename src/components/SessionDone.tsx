import React, { useEffect, useState } from 'react';
import type { SessionRecord, VoiceCrossCheckResult } from '../types';
import { CONDITION_DETAILS } from '../types';
import { apiClient } from '../api/client';
import { useI18n } from '../i18n/I18nContext';
import { SparklesIcon, CalendarIcon } from './common/Icons';

interface SessionDoneProps {
  session: SessionRecord | null;
  activeDay: number;
  totalDays: number;
  onGoHome: () => void;
  onViewHistory: () => void;
}

export const SessionDone: React.FC<SessionDoneProps> = ({
  session,
  activeDay,
  totalDays,
  onGoHome,
  onViewHistory
}) => {
  const { t } = useI18n();
  const detail = session ? CONDITION_DETAILS[session.condition] : null;
  const [therapistResult, setTherapistResult] = useState<VoiceCrossCheckResult | null>(null);

  useEffect(() => {
    if (session) {
      apiClient
        .crossCheckVoice({
          condition: session.condition,
          saNote: session.saNote,
          saHz: session.saHz,
          averageCentsError: Math.max(-10, Math.min(10, (100 - session.meanAccuracy) * 0.4)),
          voicedDurationSeconds: session.voicedSeconds,
        })
        .then((res) => setTherapistResult(res))
        .catch(() => {});
    }
  }, [session]);

  return (
    <div className="session-done-screen card" style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <SparklesIcon size={52} color="var(--success)" />
      </div>
      <h2 style={{ color: 'var(--success)', marginBottom: '0.5rem', fontSize: '2rem' }}>
        {t('sessionDone.title')}
      </h2>

      {/* FR-10 Requirement Text */}
      <div
        style={{
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid var(--success)',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '550px',
          margin: '1rem auto 2rem auto',
          color: '#86efac'
        }}
      >
        <p style={{ fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.6 }}>
          "Session is over. Stop the device and next day again repeat this. Continue this chanting for next 45 days."
        </p>
      </div>

      {/* Musician-Therapist Assessment Card */}
      {therapistResult && (
        <div
          style={{
            background: 'rgba(30, 41, 59, 0.75)',
            border: '1px solid var(--accent-primary)',
            borderRadius: '12px',
            padding: '1.25rem',
            maxWidth: '500px',
            margin: '0 auto 1.5rem auto',
            textAlign: 'left',
            boxShadow: '0 8px 24px -4px rgba(0,0,0,0.4)',
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--accent-primary)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.75px',
              marginBottom: '0.35rem',
            }}
          >
            Therapist Vocal Analysis · {therapistResult.referenceSample.chakra} Swara {therapistResult.referenceSample.swar}
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f8fafc', marginBottom: '0.35rem' }}>
            {therapistResult.therapistGuidance.headline}
          </div>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
            {therapistResult.therapistGuidance.encouragement}
          </p>
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              padding: '0.75rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.88rem',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <strong style={{ color: 'var(--accent-primary)' }}>Coaching Focus: </strong>
            {therapistResult.therapistGuidance.techniqueTip}
          </div>
        </div>
      )}

      {/* Stats Summary Card */}
      {session && (
        <div style={{ background: '#0f172a', borderRadius: '12px', padding: '1.5rem', maxWidth: '500px', margin: '0 auto 2rem auto', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
            SESSION STATISTICS (DAY {session.dayIndex})
          </h3>

          <div className="session-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.95rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Condition:</span>
              <div style={{ fontWeight: 700 }}>{detail?.name}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Key (Sa):</span>
              <div style={{ fontWeight: 700 }}>{session.saNote} ({session.saHz.toFixed(1)} Hz)</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Evaluation Accuracy:</span>
              <div style={{ fontWeight: 700, color: 'var(--success)' }}>{session.evalAccuracy}%</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Overall Mean Accuracy:</span>
              <div style={{ fontWeight: 700, color: 'var(--success)' }}>{session.meanAccuracy}%</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Voiced Chanting Time:</span>
              <div style={{ fontWeight: 700 }}>{session.voicedSeconds} seconds</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Program Status:</span>
              <div style={{ fontWeight: 700 }}>Day {activeDay} of {totalDays}</div>
            </div>
          </div>
        </div>
      )}

      <div className="screen-action-group" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn-primary" style={{ fontSize: '1.05rem', padding: '0.85rem 2rem' }} onClick={onGoHome}>
          Return to Dashboard
        </button>
        <button
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          onClick={() => {
            apiClient.downloadCalendar(detail?.name || 'Swara Healing');
          }}
        >
          <CalendarIcon size={16} /> Download 45-Day Calendar (.ics)
        </button>
        <button className="btn-secondary" onClick={onViewHistory}>
          View History Log
        </button>
      </div>
    </div>
  );
};
