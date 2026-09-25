import React, { useState, useEffect } from 'react';
import { collectDeviceDiagnostics, type DeviceDiagnostics } from '../../utils/diagnostics';
import { CloseIcon, FlaskIcon, SmartphoneIcon, AlertTriangleIcon, LotusIcon, StarIcon } from './Icons';

interface BetaFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BetaFeedbackModal: React.FC<BetaFeedbackModalProps> = ({ isOpen, onClose }) => {
  const [diagnostics, setDiagnostics] = useState<DeviceDiagnostics | null>(null);
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState<'audio_quality' | 'ease_of_use' | 'accuracy' | 'bug' | 'general'>('accuracy');
  const [difficulty, setDifficulty] = useState<'easy' | 'moderate' | 'difficult'>('moderate');
  const [comments, setComments] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      collectDeviceDiagnostics().then((diag) => {
        setDiagnostics(diag);
        // Automatically send anonymized hardware capabilities audit
        fetch('/api/beta/diagnostics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(diag),
        }).catch(() => {});
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/beta/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          category,
          difficulty,
          comments,
          email: email || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit feedback');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '2rem',
          position: 'relative',
          background: '#1e293b',
          border: '1px solid #475569',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '1.25rem',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Close modal"
        >
          <CloseIcon size={18} />
        </button>

        <h2 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FlaskIcon size={20} />
          <span>Phase 3 Beta Feedback & Diagnostics</span>
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Help us calibrate scale detection accuracy and validate device performance.
        </p>

        {/* Device Capabilities Audit */}
        {diagnostics && (
          <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', borderBottom: '1px solid #334155', paddingBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <SmartphoneIcon size={16} />
              <span>DEVICE CAPABILITY AUDIT</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>OS: <strong>{diagnostics.os}</strong></div>
              <div>Browser: <strong>{diagnostics.browser}</strong></div>
              <div>AudioWorklet: <strong style={{ color: diagnostics.audioWorkletSupported ? 'var(--success)' : 'var(--danger)' }}>{diagnostics.audioWorkletSupported ? 'Supported' : 'Unavailable'}</strong></div>
              <div>Wake Lock: <strong style={{ color: diagnostics.wakeLockSupported ? 'var(--success)' : 'var(--warning)' }}>{diagnostics.wakeLockSupported ? 'Supported' : 'Unavailable'}</strong></div>
              <div>Audio Sample Rate: <strong>{diagnostics.sampleRate ? `${diagnostics.sampleRate} Hz` : 'N/A'}</strong></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>Bluetooth Warning:</span>
                <strong>
                  {diagnostics.isNarrowband ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: 'var(--warning)' }}>
                      <AlertTriangleIcon size={14} /> Narrowband
                    </span>
                  ) : (
                    'Clean (≥16kHz)'
                  )}
                </strong>
              </div>
            </div>
          </div>
        )}

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
              <LotusIcon size={44} color="var(--accent-primary)" />
            </div>
            <h3 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Thank You!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Your field feedback has been submitted to the research metrics repository.
            </p>
            <button className="btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--danger)', padding: '0.5rem', borderRadius: '6px', color: '#fca5a5', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Practice Experience Rating
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: star <= rating ? '#fbbf24' : '#475569',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    aria-label={`${star} star`}
                  >
                    <StarIcon size={22} filled={star <= rating} color={star <= rating ? '#fbbf24' : '#475569'} />
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
                >
                  <option value="accuracy">Pitch Accuracy</option>
                  <option value="audio_quality">Audio / Tone Quality</option>
                  <option value="ease_of_use">Ease of Use</option>
                  <option value="bug">Bug Report</option>
                  <option value="general">General Feedback</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                  Pitch Holding Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: '#0f172a', border: '1px solid #334155', color: '#f8fafc' }}
                >
                  <option value="easy">Easy (Natural hold)</option>
                  <option value="moderate">Moderate (Some strain)</option>
                  <option value="difficult">Difficult (Could not reach)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Your Email (Optional, for tester follow-up)
              </label>
              <input
                type="email"
                placeholder="tester@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                Comments & Observations
              </label>
              <textarea
                rows={3}
                placeholder="How did the pitch tracking feel? Any microphone lag or audio cutouts?"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#f8fafc',
                  fontSize: '0.85rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Beta Telemetry & Feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
