import React, { useState } from 'react';
import { apiClient } from '../api/client';

interface WelcomeProps {
  activeDay: number;
  totalDays: number;
  disclaimerAccepted: boolean;
  onAcceptDisclaimer: () => void;
  onStartProgram: () => void;
  onViewHistory: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({
  activeDay,
  totalDays,
  disclaimerAccepted,
  onAcceptDisclaimer,
  onStartProgram,
  onViewHistory
}) => {
  const [showModal, setShowModal] = useState(!disclaimerAccepted);

  const handleModalAccept = () => {
    onAcceptDisclaimer();
    setShowModal(false);
  };

  const progressPercent = Math.round((activeDay / totalDays) * 100);

  return (
    <div className="welcome-screen card" style={{ padding: '2rem', textAlign: 'center' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
          Swara Healing — Music Mantra
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          Browser-Based Guided Chakra Sound Therapy & Pitch-Tracked Chanting
        </p>
      </header>

      {/* Program Progress Ring / Display */}
      <div
        style={{
          margin: '2rem auto',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          border: '8px solid #334155',
          borderTopColor: 'var(--accent-primary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.2)'
        }}
      >
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Program Day
        </span>
        <span style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {activeDay}
        </span>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          of {totalDays} Days ({progressPercent}%)
        </span>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        {!disclaimerAccepted ? (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '1rem', borderRadius: '8px', color: '#fca5a5' }}>
            <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Medical Disclaimer Required</p>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
              You must acknowledge and accept the medical disclaimer before accessing audio recording features.
            </p>
            <button className="btn-secondary" onClick={() => setShowModal(true)}>
              Read & Accept Medical Disclaimer
            </button>
          </div>
        ) : (
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--success)', padding: '0.75rem', borderRadius: '8px', color: '#86efac', fontSize: '0.9rem' }}>
            ✓ Medical Disclaimer Accepted
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          className="btn-primary"
          style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}
          disabled={!disclaimerAccepted}
          onClick={onStartProgram}
        >
          Begin Today's Practice (Day {activeDay})
        </button>
        <button
          className="btn-secondary"
          onClick={() => {
            apiClient.downloadCalendar('Swara Healing 45-Day Program');
          }}
        >
          📅 Download 45-Day Schedule (.ics)
        </button>
        <button className="btn-secondary" onClick={onViewHistory}>
          View Session History
        </button>
      </div>

      {/* Medical Disclaimer Modal (FR-1) */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ textAlign: 'left' }}>
            <h2 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>
              Important Medical & Usage Disclaimer
            </h2>
            <div style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.5rem' }}>
              <p style={{ marginBottom: '0.75rem' }}>
                <strong>Swara Healing (Music Mantra)</strong> is a browser-based guided chanting tool intended solely for relaxation, mindfulness, and personal spiritual practice.
              </p>
              <p style={{ marginBottom: '0.75rem' }}>
                • This application is <strong>NOT a medical device</strong> and does not provide diagnosis, treatment, cure, or prevention for diabetes, thyroid conditions, hypertension, or any medical disorder.
              </p>
              <p style={{ marginBottom: '0.75rem' }}>
                • <strong>Do NOT modify or stop taking any prescribed medication</strong> or medical treatment based on your use of this app. Always consult a licensed healthcare professional for medical concerns.
              </p>
              <p style={{ marginBottom: '0.75rem' }}>
                • Your microphone audio is processed entirely inside your local web browser and is <strong>never recorded or transmitted to any external server</strong>.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn-primary" onClick={handleModalAccept}>
                I Understand & Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
