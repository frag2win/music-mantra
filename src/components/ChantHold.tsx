import React, { useEffect, useState, useRef } from 'react';
import type { HealthCondition, SessionRecord } from '../types';
import { CONDITION_DETAILS } from '../types';
import { AudioEngine } from '../audio/audio-engine';
import { centError as calcCentError, centToAccuracy } from '../audio/accuracy';
import type { PitchFrame } from '../audio/scale-detector';
import { PitchMeter } from './common/PitchMeter';

interface ChantHoldProps {
  condition: HealthCondition;
  saNote: string;
  saHz: number;
  activeDay: number;
  evalAccuracy: number;
  onHoldPassed: (session: SessionRecord) => void;
  onHoldFailed: () => void;
  onPause: () => void;
}

export const ChantHold: React.FC<ChantHoldProps> = ({
  condition,
  saNote,
  saHz,
  activeDay,
  evalAccuracy,
  onHoldPassed,
  onHoldFailed,
  onPause
}) => {
  const detail = CONDITION_DETAILS[condition];
  const targetHz = saHz * detail.ratio;

  const [remainingSeconds, setRemainingSeconds] = useState(600); // 10 minutes (600s)
  const [voicedSeconds, setVoicedSeconds] = useState(0);
  const [currentAccuracy, setCurrentAccuracy] = useState(evalAccuracy);
  const [currentNote, setCurrentNote] = useState<string>('--');
  const [currentHz, setCurrentHz] = useState<number | undefined>(undefined);
  const [centErr, setCentErr] = useState<number>(0);

  const totalAccuraciesRef = useRef<number[]>([]);
  const voicedFramesCountRef = useRef<number>(0);
  const isCompleteRef = useRef(false);
  const engineRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    isCompleteRef.current = false;
    let wakeLock: any = null;

    if ('wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen').then((lock: any) => {
        wakeLock = lock;
      }).catch(() => {});
    }

    const engine = new AudioEngine({
      onPitchFrame: (frame: PitchFrame) => {
        if (isCompleteRef.current) return;

        if (frame.conf > 0.6 && frame.f0 > 70 && frame.f0 < 800) {
          const errCents = calcCentError(frame.f0, targetHz);
          const frameAcc = centToAccuracy(errCents);

          totalAccuraciesRef.current.push(frameAcc);
          voicedFramesCountRef.current += 1;

          // Note name lookup
          const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
          const midi = Math.round(69 + 12 * Math.log2(frame.f0 / 440));
          const noteName = noteNames[((midi % 12) + 12) % 12];
          const octave = Math.floor(midi / 12) - 1;

          setCurrentNote(`${noteName}${octave}`);
          setCurrentHz(frame.f0);
          setCentErr(errCents);
          setCurrentAccuracy(frameAcc);

          const currentVoicedSec = voicedFramesCountRef.current * 0.0116;
          setVoicedSeconds(currentVoicedSec);
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
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }

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

        onHoldPassed(sessionRecord);
      } else {
        onHoldFailed();
      }
    };

    // 1-second wall clock countdown timer (FR-9)
    const countdownTimer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          finishHoldSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      isCompleteRef.current = true;
      clearInterval(countdownTimer);
      if (engineRef.current) {
        engineRef.current.stopListening();
      }
      if (wakeLock) {
        wakeLock.release().catch(() => {});
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
      <h2 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
        Step 6: 10-Minute Guided Chanting Hold
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Condition: <strong style={{ color: 'var(--text-primary)' }}>{detail.name}</strong> ("{detail.mantra}") · Key: <strong>{saNote} ({saHz.toFixed(1)} Hz)</strong>
      </p>

      {/* Timer Display */}
      <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '1.5rem', maxWidth: '350px', margin: '0 auto 1.5rem auto' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>COUNTDOWN REMAINING</div>
        <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formattedTime}</div>
      </div>

      {/* Pitch Meter */}
      <PitchMeter
        currentAccuracy={currentAccuracy}
        targetNote={`${detail.swar} (${detail.mantra})`}
        targetHz={targetHz}
        currentNote={currentNote}
        currentHz={currentHz}
        centError={centErr}
        label="Live Chanting Pitch Meter"
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
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
            ℹ️ Silent wall-clock time does not count toward session completion. Keep chanting!
          </p>
        )}
      </div>

      <button className="btn-secondary" style={{ marginTop: '1rem' }} onClick={onPause}>
        Pause Session
      </button>
    </div>
  );
};
