import React, { useEffect, useState, useRef } from 'react';
import type { HealthCondition, SessionRecord } from '../types';
import { CONDITION_DETAILS } from '../types';
import { AudioEngine } from '../audio/audio-engine';
import { centError as calcCentError, centToAccuracy } from '../audio/accuracy';
import type { PitchFrame } from '../audio/scale-detector';
import { PitchMeter } from './common/PitchMeter';
import { wakeLockManager } from '../utils/wake-lock';
import { ScreenReaderAnnouncer } from './common/ScreenReaderAnnouncer';
import { useI18n } from '../i18n/I18nContext';
import { ChakraBackdrop } from './animations/ChakraBackdrop';
import { InfoIcon, ArrowLeftIcon } from './common/Icons';
import { apiClient } from '../api/client';

interface ChantHoldProps {
  condition: HealthCondition;
  saNote: string;
  saHz: number;
  activeDay: number;
  evalAccuracy: number;
  onHoldPassed: (session: SessionRecord) => void;
  onHoldFailed: () => void;
  onPause: () => void;
  onBack?: () => void;
}

export const ChantHold: React.FC<ChantHoldProps> = ({
  condition,
  saNote,
  saHz,
  activeDay,
  evalAccuracy,
  onHoldPassed,
  onHoldFailed,
  onPause,
  onBack
}) => {
  const { t } = useI18n();
  const detail = CONDITION_DETAILS[condition];
  const targetHz = saHz * detail.ratio;

  const [remainingSeconds, setRemainingSeconds] = useState(600); // 10 minutes (600s)
  const remainingRef = useRef<number>(600);
  const [voicedSeconds, setVoicedSeconds] = useState(0);
  const [currentAccuracy, setCurrentAccuracy] = useState(evalAccuracy);
  const [currentNote, setCurrentNote] = useState<string>('--');
  const [currentHz, setCurrentHz] = useState<number | undefined>(undefined);
  const [centErr, setCentErr] = useState<number>(0);
  const [therapistTip, setTherapistTip] = useState<string>('');

  const totalAccuraciesRef = useRef<number[]>([]);
  const voicedFramesCountRef = useRef<number>(0);
  const pitchFramesHistoryRef = useRef<PitchFrame[]>([]);
  const isCompleteRef = useRef(false);
  const engineRef = useRef<AudioEngine | null>(null);

  // Musician-Therapist smoothing & throttle refs
  const smoothedCentRef = useRef<number>(0);
  const smoothedHzRef = useRef<number>(targetHz);
  const lastRenderTimeRef = useRef<number>(0);

  useEffect(() => {
    isCompleteRef.current = false;
    remainingRef.current = 600;
    setRemainingSeconds(600);
    smoothedCentRef.current = 0;
    smoothedHzRef.current = targetHz;
    wakeLockManager.acquire();

    const engine = new AudioEngine({
      onPitchFrame: (frame: PitchFrame) => {
        if (isCompleteRef.current) return;

        // Filter out plosives/unvoiced audio
        if (frame.conf > 0.65 && frame.f0 > 70 && frame.f0 < 800) {
          const rawErrCents = calcCentError(frame.f0, targetHz);
          const frameAcc = centToAccuracy(rawErrCents);

          totalAccuraciesRef.current.push(frameAcc);
          voicedFramesCountRef.current += 1;
          pitchFramesHistoryRef.current.push(frame);

          // Exponential smoothing on cents and frequency (alpha = 0.20)
          smoothedCentRef.current += (rawErrCents - smoothedCentRef.current) * 0.20;
          smoothedHzRef.current += (frame.f0 - smoothedHzRef.current) * 0.20;

          const currentVoicedSec = voicedFramesCountRef.current * 0.0116;

          // Throttle UI re-renders to ~33ms (30 FPS)
          const now = performance.now();
          if (now - lastRenderTimeRef.current >= 33) {
            lastRenderTimeRef.current = now;

            const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const midi = Math.round(69 + 12 * Math.log2(smoothedHzRef.current / 440));
            const noteName = noteNames[((midi % 12) + 12) % 12];
            const octave = Math.floor(midi / 12) - 1;

            setCurrentNote(`${noteName}${octave}`);
            setCurrentHz(smoothedHzRef.current);
            setCentErr(smoothedCentRef.current);
            setCurrentAccuracy(frameAcc);
            setVoicedSeconds(currentVoicedSec);

            if (Math.abs(smoothedCentRef.current) <= 18) {
              setTherapistTip('Resonance lock established. Allow sound to reverberate effortlessly.');
            } else if (smoothedCentRef.current < -18) {
              setTherapistTip('Gently float pitch upward without straining throat.');
            } else {
              setTherapistTip('Release throat tension and let the tone ease downward.');
            }
          }
        }
      }
    });

    engineRef.current = engine;

    engine.requestMic().then(() => {
      engine.startListening();
    }).catch((err: unknown) => {
      console.error('Failed to start listening for 10-minute hold:', err);
    });

    const finishHoldSession = () => {
      if (isCompleteRef.current) return;
      isCompleteRef.current = true;

      engine.stopListening();
      wakeLockManager.release();

      const totalVoiced = voicedFramesCountRef.current * 0.0116;
      const minRequiredVoiced = 300; // 50% of 600s = 300s

      if (totalVoiced >= minRequiredVoiced) {
        const meanAcc =
          totalAccuraciesRef.current.length > 0
            ? totalAccuraciesRef.current.reduce((a, b) => a + b, 0) / totalAccuraciesRef.current.length
            : evalAccuracy;

        const sessionRecord: SessionRecord = {
          id: `sess-${Date.now()}`,
          dayIndex: activeDay,
          date: new Date().toISOString(),
          condition,
          saNote,
          saHz,
          evalAccuracy: Math.round(evalAccuracy),
          meanAccuracy: Math.round(meanAcc),
          voicedSeconds: Math.round(totalVoiced),
          totalDurationSeconds: 600,
          completed: true
        };

        // Cross-check session audio metadata against sample set
        apiClient.crossCheckVoice({
          condition,
          saNote,
          saHz,
          measuredHz: smoothedHzRef.current,
          voicedDurationSeconds: totalVoiced,
          frames: pitchFramesHistoryRef.current,
        }).catch((err) => {
          console.warn('[ChantHold] Background voice cross-check sync:', err);
        });

        onHoldPassed(sessionRecord);
      } else {
        onHoldFailed();
      }
    };

    // 1-second wall clock countdown timer (FR-9)
    const countdownTimer = setInterval(() => {
      remainingRef.current -= 1;
      setRemainingSeconds(remainingRef.current);

      if (remainingRef.current <= 0) {
        clearInterval(countdownTimer);
        finishHoldSession();
      }
    }, 1000);

    return () => {
      isCompleteRef.current = true;
      clearInterval(countdownTimer);
      wakeLockManager.release();
      if (engineRef.current) {
        engineRef.current.stopListening();
      }
    };
  }, [condition, saHz, targetHz, activeDay, saNote, evalAccuracy, onHoldPassed, onHoldFailed]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const voicedPercent = Math.min(100, Math.round((voicedSeconds / 300) * 100));
  const voicedTargetMet = voicedSeconds >= 300;

  return (
    <div className="chant-hold-screen card" style={{ padding: '2rem', textAlign: 'center' }}>
      {/* WCAG 2.1 AA Screen Reader Live Announcer */}
      <ScreenReaderAnnouncer
        message={`${t('chantHold.timeRemaining', { time: formattedTime })}. ${t('chantEval.accuracy')}: ${Math.round(currentAccuracy)} percent.`}
        minIntervalMs={4000}
      />

      <h2 style={{ color: 'var(--chakra-theme-accent, var(--accent-primary))', marginBottom: '0.5rem' }}>
        {t('chantHold.title')}
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Condition: <strong style={{ color: 'var(--text-primary)' }}>{t(`conditions.${detail.id}.name`)}</strong> ("{t(`conditions.${detail.id}.mantra`)}") · Key: <strong>{saNote} ({saHz.toFixed(1)} Hz)</strong>
      </p>

      {/* Calming visual motion anchor for 10-minute hold */}
      <ChakraBackdrop size={200} showGuideText={true} showIntensityControl={false} />

      {/* Timer Display */}
      <div style={{ background: '#0f172a', border: '1px solid var(--chakra-theme-card-border, #334155)', borderRadius: '12px', padding: '1.25rem', maxWidth: '350px', margin: '0 auto 1.5rem auto' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>COUNTDOWN REMAINING</div>
        <div className="countdown-display" style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formattedTime}</div>
      </div>

      {/* Pitch Meter */}
      <PitchMeter
        currentAccuracy={currentAccuracy}
        targetNote={`${t(`conditions.${detail.id}.swar`)} (${t(`conditions.${detail.id}.mantra`)})`}
        targetHz={targetHz}
        currentNote={currentNote}
        currentHz={currentHz}
        centError={centErr}
        label="Live Chanting Pitch Meter"
        therapistTip={therapistTip}
      />

      {/* Voiced Time Progress Bar (FR-9 minimum 50% / 300s required) */}
      <div style={{ maxWidth: '500px', margin: '1.5rem auto', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
          <span>Voiced Chanting Target (≥300s required)</span>
          <span style={{ fontWeight: 700, color: voicedTargetMet ? 'var(--success)' : 'var(--warning)' }}>
            {voicedSeconds.toFixed(0)}s / 300s ({voicedPercent}%)
          </span>
        </div>
        <div style={{ height: '14px', background: '#334155', borderRadius: '7px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, (voicedSeconds / 300) * 100)}%`,
              background: voicedTargetMet ? 'var(--success)' : 'var(--warning)',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
        {!voicedTargetMet && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <InfoIcon size={14} color="var(--accent-primary)" />
            <span>Silent wall-clock time does not count toward session completion. Keep chanting!</span>
          </p>
        )}
      </div>

      <div className="screen-action-group" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
        <button className="btn-secondary" onClick={onPause}>
          Pause Session
        </button>
        {onBack && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              isCompleteRef.current = true;
              if (engineRef.current) {
                engineRef.current.stopListening();
                engineRef.current.destroy();
              }
              wakeLockManager.release();
              onBack();
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeftIcon size={16} /> Back to Mantra Preview
          </button>
        )}
      </div>
    </div>
  );
};
