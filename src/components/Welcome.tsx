import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { useI18n } from '../i18n/I18nContext';
import { CheckCircleIcon, CalendarIcon, LotusIcon } from './common/Icons';

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
  const { t } = useI18n();
  const [showModal, setShowModal] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(true);

  const handleModalAccept = () => {
    if (!ageConfirmed) return;
    onAcceptDisclaimer();
    setShowModal(false);
  };

  const progressPercent = Math.round((activeDay / totalDays) * 100);

  return (
    <div className="welcome-screen card" style={{ padding: '2rem', textAlign: 'center' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 className="welcome-title" style={{ fontSize: '2.2rem', marginBottom: '0.5rem', color: 'var(--accent-primary)' }}>
          {t('welcome.title')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          {t('welcome.tagline')}
        </p>
      </header>

      {/* Program Progress Ring / Display */}
      <div
        className="welcome-progress-ring"
        style={{
          margin: '1.75rem auto',
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
        <span className="welcome-ring-number" style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {activeDay}
        </span>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          of {totalDays} Days ({progressPercent}%)
        </span>
      </div>

      <div style={{ marginBottom: '1.75rem' }}>
        {!disclaimerAccepted ? (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '1rem', borderRadius: '16px 4px 16px 4px', color: '#fca5a5' }}>
            <p style={{ marginBottom: '0.75rem', fontWeight: 600 }}>Medical Disclaimer Required</p>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
              You must acknowledge and accept the medical disclaimer before accessing audio recording features.
            </p>
            <button className="btn-secondary" onClick={() => setShowModal(true)}>
              Read & Accept Medical Disclaimer
            </button>
          </div>
        ) : (
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--success)', padding: '0.75rem 1.25rem', borderRadius: '16px 4px 16px 4px', color: '#86efac', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
            <CheckCircleIcon size={16} />
            <span>Medical Disclaimer Accepted</span>
          </div>
        )}
      </div>

      <div className="screen-action-group" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          className="btn-primary"
          style={{ fontSize: '1.05rem', padding: '0.95rem 2.4rem', display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}
          disabled={!disclaimerAccepted}
          onClick={onStartProgram}
        >
          <LotusIcon size={20} color="#ffffff" />
          <span>Begin Today's Practice (Day {activeDay})</span>
        </button>
        <button
          className="btn-secondary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={() => {
            apiClient.downloadCalendar('Swara Healing 45-Day Program');
          }}
        >
          <CalendarIcon size={16} /> Download 45-Day Schedule (.ics)
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

            <div style={{ margin: '1.25rem 0', background: 'rgba(30, 41, 59, 0.7)', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid rgba(148, 163, 184, 0.25)', backdropFilter: 'blur(8px)' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    accentColor: 'var(--accent-primary)',
                    cursor: 'pointer',
                    marginTop: '0.15rem'
                  }}
                />
                <span style={{ lineHeight: '1.4' }}>
                  {t('welcome.ageDeclaration')}
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                className="btn-primary"
                onClick={handleModalAccept}
                disabled={!ageConfirmed}
                style={{ opacity: ageConfirmed ? 1 : 0.5, cursor: ageConfirmed ? 'pointer' : 'not-allowed' }}
              >
                I Understand & Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
