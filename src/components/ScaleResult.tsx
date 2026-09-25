import React from 'react';
import type { ScaleDetectionResult } from '../audio/scale-detector';
import { AlertTriangleIcon } from './common/Icons';

interface ScaleResultProps {
  scaleResult: ScaleDetectionResult | null;
  selectedSaNote: string | null;
  selectedSaHz: number | null;
  saHoldEnabled: boolean;
  onOverrideSa: (saNote: string, saHz: number) => void;
  onToggleSaHold: () => void;
  onConfirmScale: () => void;
  onRetrySinging: () => void;
}

const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const NOTE_BASE_FREQS: Record<string, number> = {
  C: 261.63,
  'C#': 277.18,
  D: 293.66,
  'D#': 311.13,
  E: 329.63,
  F: 349.23,
  'F#': 369.99,
  G: 392.0,
  'G#': 415.3,
  A: 440.0,
  'A#': 466.16,
  B: 493.88
};

export const ScaleResult: React.FC<ScaleResultProps> = ({
  scaleResult,
  selectedSaNote,
  selectedSaHz,
  saHoldEnabled,
  onOverrideSa,
  onToggleSaHold,
  onConfirmScale,
  onRetrySinging
}) => {
  if (!scaleResult) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>No scale detection result found.</p>
        <button className="btn-primary" onClick={onRetrySinging}>
          Re-sing
        </button>
      </div>
    );
  }

  const confidencePercent = Math.round(scaleResult.confidence * 100);
  const currentSa = selectedSaNote || scaleResult.tonic;
  const currentHz = selectedSaHz || scaleResult.saFrequency;

  return (
    <div className="scale-result-screen card" style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
        Scale & Tonic (Sa) Result
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Your detected scale is <strong style={{ color: 'var(--text-primary)' }}>{scaleResult.tonic} {scaleResult.mode}</strong>
      </p>

      {/* Main Result Card */}
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: '12px',
          padding: '1.5rem',
          maxWidth: '450px',
          margin: '0 auto 1.5rem auto'
        }}
      >
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          PRIMARY TONIC (Sa)
        </div>
        <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent-primary)', margin: '0.25rem 0' }}>
          {currentSa}
        </div>
        <div style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 600 }}>
          {currentHz.toFixed(1)} Hz
        </div>

        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-around', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <div>
            Confidence: <span style={{ fontWeight: 700, color: scaleResult.lowConfidence ? 'var(--warning)' : 'var(--success)' }}>{confidencePercent}%</span>
          </div>
          {scaleResult.runnerUp && (
            <div>
              Runner Up: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{scaleResult.runnerUp.tonic} {scaleResult.runnerUp.mode}</span>
            </div>
          )}
        </div>

        {/* Low Confidence Warning (FR-3 / §6.4) */}
        {scaleResult.lowConfidence && (
          <div style={{ marginTop: '1rem', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid var(--warning)', padding: '0.75rem', borderRadius: '6px', color: '#fcd34d', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertTriangleIcon size={16} />
            <span>Detection confidence is below 60%. You can manually pick your preferred Sa note below or use the 4s Hold feature.</span>
          </div>
        )}
      </div>

      {/* Manual Sa Override Selector */}
      <div style={{ maxWidth: '500px', margin: '0 auto 1.5rem auto', textAlign: 'left' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textAlign: 'center' }}>
          Manual Sa Override (Select any pitch class):
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem' }}>
          {ALL_NOTES.map((note) => {
            const isSelected = note === currentSa;
            return (
              <button
                key={note}
                className={isSelected ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '0.5rem', fontSize: '0.9rem' }}
                onClick={() => onOverrideSa(note, NOTE_BASE_FREQS[note])}
              >
                {note}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sa Hold Feature Flag Toggle (§6.4) */}
      <div style={{ margin: '1rem 0 1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <input
          type="checkbox"
          id="saHoldToggle"
          checked={saHoldEnabled}
          onChange={onToggleSaHold}
          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
        />
        <label htmlFor="saHoldToggle" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          Enable 4-Second Single Note Hold mode (sa_hold feature flag)
        </label>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button className="btn-primary" style={{ fontSize: '1.05rem', padding: '0.85rem 2rem' }} onClick={onConfirmScale}>
          Confirm Key & Pick Mantra
        </button>
        <button className="btn-secondary" onClick={onRetrySinging}>
          Re-sing Song
        </button>
      </div>
    </div>
  );
};
