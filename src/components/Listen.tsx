import React, { useState, useEffect } from 'react';
import type { HealthCondition } from '../types';
import { CONDITION_DETAILS } from '../types';
import { AudioEngine } from '../audio/audio-engine';
import { useI18n } from '../i18n/I18nContext';
import { AlertTriangleIcon, PlayIcon, StopIcon, ClockIcon, MusicNoteIcon, LockIcon, ArrowLeftIcon } from './common/Icons';

interface ListenProps {
  condition: HealthCondition;
  saNote: string;
  saHz: number;
  onStartChanting: () => void;
  onChangeCondition: () => void;
  onBack?: () => void;
}

export const Listen: React.FC<ListenProps> = ({
  condition,
  saNote,
  saHz,
  onStartChanting,
  onChangeCondition,
  onBack
}) => {
  const { t } = useI18n();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const engineRef = React.useRef<AudioEngine | null>(null);
  const detail = CONDITION_DETAILS[condition];
  const targetHz = saHz * detail.ratio;

  useEffect(() => {
    const engine = new AudioEngine({
      onPlaybackStopped: () => setIsPlaying(false),
      onError: (err) => {
        console.error('[Listen] AudioEngine error:', err);
        setPlaybackError(err.message);
        setIsPlaying(false);
        setIsLoading(false);
      },
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
      setPlaybackError(null);
      setIsLoading(true);

      try {
        // Half-duplex enforcement: ensure mic listening is stopped
        engineRef.current.stopListening();

        const noteSlug = saNote.replace('#', 'sharp');
        const register = saHz >= 220 ? 'high' : 'low';
        const audioUrl = `/mantras/${condition}/${noteSlug}-${register}.mp3`;

        await engineRef.current.loadMantra(audioUrl, {
          saHz,
          targetHz,
          condition,
        });

        engineRef.current.playMantra();
        setIsPlaying(true);
      } catch (err) {
        console.error('[Listen] Failed to play mantra:', err);
        setPlaybackError(err instanceof Error ? err.message : 'Failed to play audio');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoAhead = () => {
    if (engineRef.current) {
      engineRef.current.stopPlayback();
    }
    setIsPlaying(false);
    onStartChanting();
  };

  const handleBack = () => {
    if (engineRef.current) {
      engineRef.current.stopPlayback();
    }
    setIsPlaying(false);
    if (onBack) {
      onBack();
    } else {
      onChangeCondition();
    }
  };

  return (
    <div className="listen-screen card" style={{ padding: '2rem', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.35rem 0.8rem' }}
        >
          <ArrowLeftIcon size={14} /> Back to Condition Menu
        </button>
      </div>

      <h2 style={{ color: 'var(--chakra-theme-accent, var(--accent-primary))', marginBottom: '0.5rem' }}>
        {t('listen.title')}
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Condition: <strong style={{ color: 'var(--text-primary)' }}>{t(`conditions.${detail.id}.name`)}</strong> ({t(`conditions.${detail.id}.chakra`)} Chakra) · Key: <strong>{saNote} ({saHz.toFixed(1)} Hz)</strong>
      </p>


      {/* Mantra Player Visual Card */}
      <div
        className="mantra-player-card"
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '2px solid var(--chakra-theme-accent, var(--accent-primary))',
          borderRadius: '16px',
          padding: '1.75rem',
          maxWidth: '450px',
          margin: '0 auto 1.5rem auto',
          boxShadow: '0 8px 24px -4px var(--chakra-theme-accent-soft, rgba(0,0,0,0.3))'
        }}
      >
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {t('listen.seedMantra')}
        </div>
        <div className="mantra-large-display" style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--chakra-theme-accent, var(--accent-primary))', margin: '0.5rem 0' }}>
          "{t(`conditions.${detail.id}.mantra`)}"
        </div>
        <div style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>
          Swara: <strong>{t(`conditions.${detail.id}.swar`)}</strong> (Target Pitch: <strong>{targetHz.toFixed(1)} Hz</strong>)
        </div>

        {/* Play/Stop Button */}
        <button
          className={isPlaying ? 'btn-danger' : 'btn-primary'}
          style={{
            fontSize: '1.1rem',
            padding: '0.95rem 2.6rem',
            color: isPlaying ? '#ffffff' : (condition === 'diabetes' ? '#1c1917' : '#ffffff'),
            textShadow: (!isPlaying && condition === 'diabetes') ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.4)',
          }}
          onClick={handleTogglePlayback}
          disabled={isLoading}
        >
          {isLoading ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <ClockIcon size={18} /> {t('listen.loading')}
            </span>
          ) : isPlaying ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <StopIcon size={18} /> {t('listen.stopBtn')}
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <PlayIcon size={18} /> {t('listen.playBtn')}
            </span>
          )}
        </button>

        {playbackError && (
          <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
            <AlertTriangleIcon size={14} />
            <span>{playbackError}</span>
          </div>
        )}

        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}>
          {isPlaying ? (
            <>
              <MusicNoteIcon size={16} color="var(--chakra-theme-accent, var(--accent-primary))" />
              <span>{t('listen.playingMsg')}</span>
            </>
          ) : (
            <span>{t('listen.idleMsg')}</span>
          )}
        </div>
      </div>

      <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid var(--accent-primary)', padding: '0.75rem 1rem', borderRadius: '8px', maxWidth: '550px', margin: '0 auto 2rem auto', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <LockIcon size={16} color="var(--accent-primary)" />
        <span>{t('listen.halfDuplex')}</span>
      </div>

      <div className="screen-action-group" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          className="btn-primary"
          style={{ fontSize: '1.05rem', padding: '0.95rem 2.6rem' }}
          onClick={handleGoAhead}
        >
          {t('listen.goAheadBtn')}
        </button>
        <button className="btn-secondary" onClick={handleBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeftIcon size={16} /> {t('listen.changeConditionBtn')}
        </button>
      </div>
    </div>
  );
};
