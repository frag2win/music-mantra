import React, { useEffect, useState, useRef, useCallback } from 'react';
import { detectScale, type ScaleDetectionResult, type PitchFrame } from '../audio/scale-detector';
import { AudioEngine } from '../audio/audio-engine';
import { evaluateSaHold } from '../audio/sa-hold';
import { useI18n } from '../i18n/I18nContext';
import { CheckIcon, ClockIcon, ArrowLeftIcon } from './common/Icons';

interface SingProps {
  saHoldEnabled?: boolean;
  onSingingComplete: (result: ScaleDetectionResult) => void;
  onRetrySinging: () => void;
  onBack?: () => void;
}

export const Sing: React.FC<SingProps> = ({
  saHoldEnabled = false,
  onSingingComplete,
  onRetrySinging,
  onBack
}) => {
  const { t } = useI18n();
  const targetDuration = saHoldEnabled ? 4 : 15;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [voicedSeconds, setVoicedSeconds] = useState(0);
  const [currentNote, setCurrentNote] = useState<string>('--');
  const [currentHz, setCurrentHz] = useState<number | null>(null);
  const [isStable, setIsStable] = useState(false);

  const pitchFramesRef = useRef<PitchFrame[]>([]);
  const engineRef = useRef<AudioEngine | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onSingingCompleteRef = useRef(onSingingComplete);
  onSingingCompleteRef.current = onSingingComplete;
  const onRetrySingingRef = useRef(onRetrySinging);
  onRetrySingingRef.current = onRetrySinging;

  // Process completed singing session — always proceeds, never blocks
  const processCompletion = useCallback((isManualFinish = false) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (engineRef.current) {
      engineRef.current.stopListening();
    }

    // Only gate on manual "Finish" button — never block auto-completion
    if (isManualFinish && pitchFramesRef.current.length < 50) {
      onRetrySingingRef.current();
      return;
    }

    if (saHoldEnabled) {
      const holdResult = evaluateSaHold(pitchFramesRef.current, 3.0, 35.0);
      const result: ScaleDetectionResult = {
        tonic: holdResult.saNote,
        tonicPitchClass: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(holdResult.saNote),
        mode: 'major',
        confidence: holdResult.stable ? 0.95 : 0.75,
        runnerUp: { tonic: holdResult.saNote, mode: 'major', confidence: 0.5 },
        lowConfidence: !holdResult.stable,
        saFrequency: holdResult.saHz,
        chromaHistogram: new Array(12).fill(0),
      };
      onSingingCompleteRef.current(result);
    } else {
      const result = detectScale(pitchFramesRef.current);
      onSingingCompleteRef.current(result);
    }
  }, [saHoldEnabled]);

  useEffect(() => {
    let isCancelled = false;
    pitchFramesRef.current = [];
    setElapsedSeconds(0);
    setVoicedSeconds(0);

    const engine = new AudioEngine({
      onPitchFrame: (frame: PitchFrame) => {
        if (isCancelled) return;
        if (frame.conf > 0.6 && frame.f0 > 70 && frame.f0 < 800) {
          pitchFramesRef.current.push(frame);

          // Convert f0 to note name for live UI readout
          const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
          const midi = Math.round(69 + 12 * Math.log2(frame.f0 / 440));
          const noteName = noteNames[((midi % 12) + 12) % 12];
          const octave = Math.floor(midi / 12) - 1;

          setCurrentNote(`${noteName}${octave}`);
          setCurrentHz(frame.f0);

          if (saHoldEnabled && pitchFramesRef.current.length > 50) {
            const holdEval = evaluateSaHold(pitchFramesRef.current, 1.0, 25.0);
            setIsStable(holdEval.stable);
          }
        }
      }
    });

    engineRef.current = engine;

    (async () => {
      try {
        await engine.requestMic();
        if (isCancelled) {
          engine.stopListening();
          return;
        }

        engine.startListening();
        const startTimestamp = performance.now();

        // High-precision wall-clock timer (250ms tick rate prevents drift and ensures responsive UI)
        timerRef.current = setInterval(() => {
          if (isCancelled) return;

          const exactElapsedSec = Math.min(
            targetDuration,
            Math.floor((performance.now() - startTimestamp) / 1000)
          );
          setElapsedSeconds(exactElapsedSec);

          // Throttled voiced time calculation from collected frames
          const voicedCount = pitchFramesRef.current.length;
          setVoicedSeconds(voicedCount * 0.0116);

          if (exactElapsedSec >= targetDuration) {
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            processCompletion();
          }
        }, 250);
      } catch (err) {
        if (!isCancelled) {
          console.error('Failed to start mic listening:', err);
        }
      }
    })();

    return () => {
      isCancelled = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (engineRef.current) {
        engineRef.current.stopListening();
      }
    };
  }, [saHoldEnabled, targetDuration, processCompletion]);

  const finishCapture = () => {
    processCompletion(true);
  };

  const voicedTargetMet = voicedSeconds >= 3.0;

  return (
    <div className="sing-screen card" style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
        {t('sing.title')} {saHoldEnabled && `(${t('sing.modeHold')})`}
      </h2>
      <p style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
        {saHoldEnabled
          ? t('sing.saHoldPrompt')
          : t('sing.instruction')}
      </p>

      {/* Live Sung Pitch Visual Box */}
      <div style={{ background: '#0f172a', borderRadius: '12px', padding: '1.5rem', maxWidth: '350px', margin: '0 auto 1.5rem auto' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
          LIVE DETECTED NOTE
        </div>
        <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
          {currentNote}
        </div>
        {currentHz && <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{currentHz.toFixed(1)} Hz</div>}

        {saHoldEnabled && (
          <div
            style={{
              marginTop: '0.75rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: isStable ? 'var(--success)' : 'var(--warning)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            {isStable ? (
              <>
                <CheckIcon size={14} /> {t('sing.steadyBadge')}
              </>
            ) : (
              <>
                <ClockIcon size={14} /> {t('sing.unvoicedBadge')}
              </>
            )}
          </div>
        )}
      </div>

      {/* Timers & Gate Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '450px', margin: '0 auto 1.5rem auto' }}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '0.75rem', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TIME ELAPSED</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{elapsedSeconds}s / {targetDuration}s</div>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '3px',
              backgroundColor: 'var(--accent-primary)',
              width: `${Math.min(100, (elapsedSeconds / targetDuration) * 100)}%`,
              transition: 'width 250ms linear'
            }}
          />
        </div>
        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '0.75rem', borderRadius: '8px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>VOICED TIME ({saHoldEnabled ? '4s Target' : '≥3s Gate'})</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: voicedTargetMet ? 'var(--success)' : 'var(--warning)' }}>
            {voicedSeconds.toFixed(1)}s
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '3px',
              backgroundColor: voicedTargetMet ? 'var(--success)' : 'var(--warning)',
              width: `${Math.min(100, (voicedSeconds / (saHoldEnabled ? 4 : 3)) * 100)}%`,
              transition: 'width 250ms linear'
            }}
          />
        </div>
      </div>

      <div style={{ maxWidth: '450px', margin: '0 auto 2rem auto', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        {voicedTargetMet ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--success)' }}>
            <CheckIcon size={14} /> Sufficient vocal frames captured! You may click Finish or let the timer complete.
          </span>
        ) : saHoldEnabled ? (
          'Hold your voice steady without wavering...'
        ) : (
          'Sing a melody naturally so we can detect your tonic (Sa) pitch...'
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button
          className="btn-primary"
          style={{ fontSize: '1.05rem', padding: '0.85rem 2rem' }}
          disabled={!voicedTargetMet}
          onClick={finishCapture}
        >
          {voicedTargetMet ? 'Finish & Analyze Key' : `Listening... (Need ${saHoldEnabled ? '4s' : '≥3s'} vocal data)`}
        </button>
        {onBack && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onBack}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeftIcon size={16} /> Back
          </button>
        )}
      </div>
    </div>
  );
};
