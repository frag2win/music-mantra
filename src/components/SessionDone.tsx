import React from 'react';
import type { SessionRecord } from '../types';
import { CONDITION_DETAILS } from '../types';
import { apiClient } from '../api/client';

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
  const detail = session ? CONDITION_DETAILS[session.condition] : null;

  return (
    <div className="session-done-screen card" style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🎉</div>
      <h2 style={{ color: 'var(--success)', marginBottom: '0.5rem', fontSize: '2rem' }}>
        Session Completed!
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

      {/* Stats Summary Card */}
      {session && (
        <div style={{ background: '#0f172a', borderRadius: '12px', padding: '1.5rem', maxWidth: '500px', margin: '0 auto 2rem auto', textAlign: 'left' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
            SESSION STATISTICS (DAY {session.dayIndex})
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.95rem' }}>
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

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn-primary" style={{ fontSize: '1.05rem', padding: '0.85rem 2rem' }} onClick={onGoHome}>
          Return to Dashboard
        </button>
        <button
          className="btn-secondary"
          onClick={() => {
            apiClient.downloadCalendar(detail?.name || 'Swara Healing');
          }}
        >
          📅 Download 45-Day Calendar (.ics)
        </button>
        <button className="btn-secondary" onClick={onViewHistory}>
          View History Log
        </button>
      </div>
    </div>
  );
};
