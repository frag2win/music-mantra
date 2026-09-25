import React, { useEffect, useState, useRef } from 'react';
import type { HealthCondition } from '../types';
import { CONDITION_DETAILS } from '../types';
import { AudioEngine } from '../audio/audio-engine';
import { centError as calcCentError, centToAccuracy, evaluationGatePassed } from '../audio/accuracy';
import type { PitchFrame } from '../audio/scale-detector';
import { PitchMeter } from './common/PitchMeter';
import { wakeLockManager } from '../utils/wake-lock';
import { ScreenReaderAnnouncer } from './common/ScreenReaderAnnouncer';
import { useI18n } from '../i18n/I18nContext';
import { ChakraBackdrop } from './animations/ChakraBackdrop';
import { ArrowLeftIcon } from './common/Icons';

import { apiClient } from '../api/client';

interface ChantEvalProps {
  condition: HealthCondition;
  saNote: string;
  saHz: number;
  onEvalPassed: (finalAccuracy: number) => void;
  onEvalFailed: (finalAccuracy: number) => void;
  onBack?: () => void;
}

export const ChantEval: React.FC<ChantEvalProps> = ({
  condition,
  saNote,
  saHz,
  onEvalPassed,
  onEvalFailed,
  onBack
}) => {
  const { t } = useI18n();
  const detail = CONDITION_DETAILS[condition];
  const targetHz = saHz * detail.ratio;

  const [currentAccuracy, setCurrentAccuracy] = useState(0);
  const [voicedSeconds, setVoicedSeconds] = useState(0);
  const [currentNote, setCurrentNote] = useState<string>('--');
  const [currentHz, setCurrentHz] = useState<number | undefined>(undefined);
  const [centErr, setCentErr] = useState<number>(0);
  const [therapistTip, setTherapistTip] = useState<string>('');

  const pitchFramesRef = useRef<PitchFrame[]>([]);
  const isFinishedRef = useRef(false);
  const engineRef = useRef<AudioEngine | null>(null);

  // Musician-Therapist smoothing & throttle refs
  const smoothedCentRef = useRef<number>(0);
  const smoothedHzRef = useRef<number>(targetHz);
  const lastRenderTimeRef = useRef<number>(0);

  useEffect(() => {
    isFinishedRef.current = false;
    pitchFramesRef.current = [];
    smoothedCentRef.current = 0;
    smoothedHzRef.current = targetHz;
    wakeLockManager.acquire();

    const engine = new AudioEngine({
      onPitchFrame: (frame: PitchFrame) => {
        if (isFinishedRef.current) return;

        // Musician-therapist filter: Ignore loud plosives / unvoiced pops
        if (frame.conf > 0.65 && frame.f0 > 70 && frame.f0 < 800) {
          const rawErrCents = calcCentError(frame.f0, targetHz);

          // Dampen erratic frame jumps with EMA filter (alpha = 0.22)
          smoothedCentRef.current += (rawErrCents - smoothedCentRef.current) * 0.22;
          smoothedHzRef.current += (frame.f0 - smoothedHzRef.current) * 0.22;

          pitchFramesRef.current.push(frame);

          const totalVoiced = pitchFramesRef.current.length * 0.0116; // ~11.6ms per frame

          // Throttle UI re-renders to ~33ms (30 FPS) so React is never flooded
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

            // Rolling 2-second window accuracy calculation with harmonic tolerance
            const nowSec = performance.now() / 1000;
            const rollingFrames = pitchFramesRef.current.filter((f) => nowSec - f.t <= 2.0);
            if (rollingFrames.length > 0) {
              const sumAcc = rollingFrames.reduce(
                (acc, f) => acc + centToAccuracy(calcCentError(f.f0, targetHz)),
                0
              );
              setCurrentAccuracy(sumAcc / rollingFrames.length);
            }

            setVoicedSeconds(totalVoiced);

            // Live gentle coaching tip
            if (Math.abs(smoothedCentRef.current) <= 18) {
              setTherapistTip('Resonating smoothly with target Swara. Maintain steady breath.');
            } else if (smoothedCentRef.current < -18) {
              setTherapistTip('Slightly flat — lift your soft palate gently upward.');
            } else {
              setTherapistTip('Slightly sharp — relax neck and let tone sink into the chest.');
            }
          }

          // Evaluation Gate Check: after 7.5 seconds of voiced chanting
          if (totalVoiced >= 7.5 && !isFinishedRef.current) {
            isFinishedRef.current = true;
            engine.stopListening();

            // Cross-check with Musician-Therapist backend service
            apiClient
              .crossCheckVoice({
                condition,
                saNote,
                saHz,
                measuredHz: smoothedHzRef.current,
                voicedDurationSeconds: totalVoiced,
                frames: pitchFramesRef.current,
              })
              .then((result) => {
                // If therapist match score is ≥ 85%, user passes with flying colors
                if (result.matchScore >= 85) {
                  onEvalPassed(result.matchScore);
                } else {
                  onEvalFailed(result.matchScore);
                }
              })
              .catch(() => {
                // Fallback to local gate evaluation if offline
                const gate = evaluationGatePassed(pitchFramesRef.current, targetHz, {
                  passThreshold: 90,
                  evalVoicedSeconds: 7.5,
                });
                if (gate.passed) {
                  onEvalPassed(gate.accuracy);
                } else {
                  onEvalFailed(gate.accuracy);
                }
              });
          }
        }
      },
    });

    engineRef.current = engine;

    engine
      .requestMic()
      .then(() => {
        engine.startListening();
      })
      .catch((err: unknown) => {
        console.error('Failed to start listening for chant evaluation:', err);
      });

    return () => {
      isFinishedRef.current = true;
      wakeLockManager.release();
      if (engineRef.current) {
        engineRef.current.stopListening();
      }
    };
  }, [condition, saHz, targetHz, onEvalPassed, onEvalFailed]);

  const targetNoteName = `${detail.swar} (${detail.mantra})`;

  return (
    <div className="chant-eval-screen card" style={{ padding: '2rem', textAlign: 'center' }}>
      {/* WCAG 2.1 AA Screen Reader Live Announcer */}
      <ScreenReaderAnnouncer
        message={`${t('chantEval.accuracy')}: ${Math.round(currentAccuracy)} percent. ${
          Math.abs(centErr) <= 15
            ? t('chantEval.inTune')
            : centErr < 0
              ? t('chantEval.flat')
              : t('chantEval.sharp')
        }`}
        minIntervalMs={3500}
      />

      <h2 style={{ color: 'var(--chakra-theme-accent, var(--accent-primary))', marginBottom: '0.5rem' }}>
        {t('chantEval.title')}
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
        {t('chantEval.instruction', {
          mantra: t(`conditions.${detail.id}.mantra`),
          swar: t(`conditions.${detail.id}.swar`),
          targetHz: targetHz.toFixed(1),
          passAcc: 90,
          voicedSec: 7.5
        })}
      </p>

      {/* Calming visual motion anchor */}
      <ChakraBackdrop size={180} showGuideText={false} showIntensityControl={false} />

      {/* FR-7 Live Accuracy Display */}
      <div style={{ margin: '0.5rem 0' }}>
        <PitchMeter
          currentAccuracy={currentAccuracy}
          targetNote={targetNoteName}
          targetHz={targetHz}
          currentNote={currentNote}
          currentHz={currentHz}
          centError={centErr}
          label={t('chantEval.accuracy')}
          therapistTip={therapistTip}
        />
      </div>

      {/* Evaluation Progress Bar */}
      <div style={{ maxWidth: '450px', margin: '1.5rem auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
          <span>Evaluation Voiced Time Progress</span>
          <span>{voicedSeconds.toFixed(1)}s / 7.5s</span>
        </div>
        <div style={{ height: '12px', background: '#334155', borderRadius: '6px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, (voicedSeconds / 7.5) * 100)}%`,
              background: 'var(--accent-primary)',
              transition: 'width 0.2s ease'
            }}
          />
        </div>
      </div>

      {onBack && (
        <div style={{ marginTop: '1.5rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              isFinishedRef.current = true;
              if (engineRef.current) {
                engineRef.current.stopListening();
                engineRef.current.destroy();
              }
              wakeLockManager.release();
              onBack();
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}
          >
            <ArrowLeftIcon size={16} /> Back to Mantra Preview
          </button>
        </div>
      )}
    </div>
  );
};
