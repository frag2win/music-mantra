import React from 'react';

interface RetryShortProps {
  voicedSeconds: number;
  onAcknowledgeRetry: () => void;
}

export const RetryShort: React.FC<RetryShortProps> = ({ voicedSeconds, onAcknowledgeRetry }) => {
  return (
    <div className="retry-short-screen card" style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⌛</div>
      <h2 style={{ color: 'var(--warning)', marginBottom: '0.5rem' }}>
        Insufficient Voiced Chanting Time
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        You chanted for <strong>{Math.round(voicedSeconds)} seconds</strong> out of the 300 seconds (50% of 10 min) required.
      </p>

      <div
        style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid var(--warning)',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '500px',
          margin: '0 auto 2rem auto',
          color: '#fcd34d'
        }}
      >
        <p style={{ fontSize: '1rem', fontWeight: 600 }}>
          Silent wall-clock time does not count toward your 45-day program session completion. Please listen to the mantra again and maintain continuous chanting during the hold.
        </p>
      </div>

      <button
        className="btn-primary"
        style={{ fontSize: '1.05rem', padding: '0.85rem 2rem' }}
        onClick={onAcknowledgeRetry}
      >
        Re-try Practice Session
      </button>
    </div>
  );
};
