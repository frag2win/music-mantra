import React from 'react';
import { TargetIcon } from './common/Icons';

interface RetryProps {
  evalAccuracy: number;
  onAcknowledgeRetry: () => void;
}

export const Retry: React.FC<RetryProps> = ({ evalAccuracy, onAcknowledgeRetry }) => {
  return (
    <div className="retry-screen card" style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <TargetIcon size={48} color="var(--warning)" />
      </div>
      <h2 style={{ color: 'var(--warning)', marginBottom: '0.5rem' }}>
        Accuracy Evaluation Not Met
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Your evaluation pitch accuracy was <strong style={{ color: 'var(--warning)' }}>{Math.round(evalAccuracy)}%</strong> (90% required).
      </p>

      {/* FR-8 Requirement Text */}
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
        <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>
          "Listen that chanting again and repeat step 6"
        </p>
      </div>

      <button
        className="btn-primary"
        style={{ fontSize: '1.05rem', padding: '0.85rem 2rem' }}
        onClick={onAcknowledgeRetry}
      >
        Return to Listen to Mantra Again
      </button>
    </div>
  );
};
