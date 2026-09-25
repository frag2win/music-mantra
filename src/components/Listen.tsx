import React, { useState, useEffect } from 'react';
import type { HealthCondition } from '../types';
import { CONDITION_DETAILS } from '../types';
import { AudioEngine } from '../audio/audio-engine';

interface ListenProps {
  condition: HealthCondition;
  saNote: string;
  saHz: number;
  onStartChanting: () => void;
  onChangeCondition: () => void;
}

export const Listen: React.FC<ListenProps> = ({
  condition,
  saNote,
  saHz,
  onStartChanting,
  onChangeCondition
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const engineRef = React.useRef<AudioEngine | null>(null);
  const detail = CONDITION_DETAILS[condition];
  const targetHz = saHz * detail.ratio;

  useEffect(() => {
    const engine = new AudioEngine({
      onPlaybackStopped: () => setIsPlaying(false),
    });
    engineRef.current = engine;

    // Platform Hardening: Acquire wake lock during listen state
    let wakeLock: any = null;
    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').then((lock: any) => {
        wakeLock = lock;
      }).catch(() => {});
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.stopPlayback();
      }
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, []);

  const handleTogglePlayback = async () => {
    if (!engineRef.current) return;

    if (isPlaying) {
      engineRef.current.stopPlayback();
      setIsPlaying(false);
    } else {
      // Half-duplex enforcement
      engineRef.current.stopListening();

      const noteSlug = saNote.replace('#', 'sharp');
      const audioUrl = `/mantras/${condition}/${noteSlug}-low.m4a`;

      await engineRef.current.loadMantra(audioUrl, {
        saHz,
        targetHz,
        condition,
      });

      engineRef.current.playMantra();
      setIsPlaying(true);
    }
  };

  const handleGoAhead = () => {
    if (engineRef.current) {
      engineRef.current.stopPlayback();
    }
    setIsPlaying(false);
    onStartChanting();
  };

  return (
    <div className="listen-screen card" style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
        Step 4: Listen to Mantra Recording
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Condition: <strong style={{ color: 'var(--text-primary)' }}>{detail.name}</strong> ({detail.chakra} Chakra) · Key: <strong>{saNote} ({saHz.toFixed(1)} Hz)</strong>
      </p>

      {/* Mantra Player Visual Card */}
      <div
        style={{
          background: '#0f172a',
          border: `2px solid var(--chakra-${detail.id})`,
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '450px',
          margin: '0 auto 2rem auto'
        }}
      >
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          SEED MANTRA & TARGET SWARA
        </div>
        <div style={{ fontSize: '3.5rem', fontWeight: 800, color: `var(--chakra-${detail.id})`, margin: '0.5rem 0' }}>
          "{detail.mantra}"
        </div>
        <div style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Swara: <strong>{detail.swar}</strong> (Target Pitch: <strong>{targetHz.toFixed(1)} Hz</strong>)
        </div>

        {/* Play/Stop Button */}
        <button
          className="btn-primary"
          style={{
            fontSize: '1.2rem',
            padding: '1rem 2.5rem',
            backgroundColor: isPlaying ? 'var(--danger)' : `var(--chakra-${detail.id})`
          }}
          onClick={handleTogglePlayback}
        >
          {isPlaying ? '⏹ Stop Mantra Playback' : '▶ Play Reference Mantra Loop'}
        </button>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
          {isPlaying ? '🎵 Playing gapless reference audio... Listen closely to pitch and tone.' : 'Click to listen to the mantra audio loop.'}
        </div>
      </div>

      <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--accent-primary)', padding: '0.75rem', borderRadius: '8px', maxWidth: '550px', margin: '0 auto 2rem auto', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        🔒 <strong>Half-duplex Safety:</strong> Clicking "Go Ahead" will automatically stop audio playback so your microphone can analyze your singing without speaker feedback.
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button
          className="btn-primary"
          style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}
          onClick={handleGoAhead}
        >
          Go Ahead and Start Chanting
        </button>
        <button className="btn-secondary" onClick={onChangeCondition}>
          Change Condition
        </button>
      </div>
    </div>
  );
};
