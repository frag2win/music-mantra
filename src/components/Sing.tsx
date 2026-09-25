import React, { useEffect, useState, useRef, useCallback } from 'react';
import { detectScale, type ScaleDetectionResult, type PitchFrame } from '../audio/scale-detector';
import { AudioEngine } from '../audio/audio-engine';
import { evaluateSaHold } from '../audio/sa-hold';

interface SingProps {
  saHoldEnabled?: boolean;
  onSingingComplete: (result: ScaleDetectionResult) => void;
  onRetrySinging: () => void;
}

export const Sing: React.FC<SingProps> = ({
  saHoldEnabled = false,
  onSingingComplete,
  onRetrySinging
}) => {
  const targetDuration = saHoldEnabled ? 4 : 15;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [voicedSeconds, setVoicedSeconds] = useState(0);
  const [currentNote, setCurrentNote] = useState<string>('--');
  const [currentHz, setCurrentHz] = useState<number | null>(null);
  const [isStable, setIsStable] = useState(false);

  const pitchFramesRef = useRef<PitchFrame[]>([]);
  const engineRef = useRef<AudioEngine | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSingingCapture = useCallback(async () => {
    pitchFramesRef.current = [];

    const engine = new AudioEngine({
      onPitchFrame: (frame: PitchFrame) => {
        if (frame.conf > 0.6 && frame.f0 > 70 && frame.f0 < 800) {
          pitchFramesRef.current.push(frame);

          // Convert f0 to note name for live UI readout
          const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
          const midi = Math.round(69 + 12 * Math.log2(frame.f0 / 440));
          const noteName = noteNames[((midi % 12) + 12) % 12];
          const octave = Math.floor(midi / 12) - 1;

          setCurrentNote(`${noteName}${octave}`);
          setCurrentHz(frame.f0);

          setVoicedSeconds((prev) => prev + 0.0116);

          if (saHoldEnabled && pitchFramesRef.current.length > 50) {
            const holdEval = evaluateSaHold(pitchFramesRef.current, 1.0, 25.0);
            setIsStable(holdEval.stable);
          }
        }
      }
    });

    engineRef.current = engine;

    try {
      await engine.requestMic();
      engine.startListening();

      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          if (prev >= targetDuration - 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            if (engineRef.current) engineRef.current.stopListening();

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
              onSingingComplete(result);
            } else {
              const result = detectScale(pitchFramesRef.current);
              onSingingComplete(result);
            }
            return targetDuration;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start mic listening:', err);
    }
  }, [onSingingComplete, saHoldEnabled, targetDuration]);

  const finishCapture = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (engineRef.current) {
      engineRef.current.stopListening();
    }

    if (pitchFramesRef.current.length < 50) {
      alert('Not enough singing detected. Please sing continuously for at least 3 seconds.');
      onRetrySinging();
      return;
    }

    const result = detectScale(pitchFramesRef.current);
    onSingingComplete(result);
  };

  useEffect(() => {
    startSingingCapture();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (engineRef.current) {
        engineRef.current.stopListening();
      }
    };
  }, [startSingingCapture]);

  const voicedTargetMet = voicedSeconds >= 3.0;

  return (
    <div className="sing-screen card" style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
        Step 2: Key & Sa Detection {saHoldEnabled && '(sa_hold Mode)'}
      </h2>
      <p style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
        {saHoldEnabled
          ? '"Please hold a single comfortable note (Sa) continuously for 4 seconds"'
          : '"Please sing a song or chant comfortably"'}
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
            }}
          >
            {isStable ? '✓ Pitch Stable (Spread < 25 cents)' : '⏳ Stabilizing vocal pitch...'}
          </div>
        )}
      </div>

      {/* Timers & Gate Progress */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', maxWidth: '450px', margin: '0 auto 1.5rem auto' }}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '0.75rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TIME ELAPSED</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{elapsedSeconds}s / {targetDuration}s</div>
        </div>
        <div style={{ background: '#1e293b', border: '1px solid #334155', padding: '0.75rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>VOICED TIME ({saHoldEnabled ? '4s Target' : '≥3s Gate'})</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, color: voicedTargetMet ? 'var(--success)' : 'var(--warning)' }}>
            {voicedSeconds.toFixed(1)}s
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '450px', margin: '0 auto 2rem auto', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        {voicedTargetMet
          ? '✓ Sufficient vocal frames captured! You may click Finish or let the countdown complete.'
          : saHoldEnabled
            ? 'Hold your voice steady without wavering...'
            : 'Sing a melody naturally so we can detect your tonic (Sa) pitch...'}
      </div>

      <button
        className="btn-primary"
        style={{ fontSize: '1.05rem', padding: '0.85rem 2rem' }}
        disabled={!voicedTargetMet}
        onClick={finishCapture}
      >
        {voicedTargetMet ? 'Finish & Analyze Key' : `Listening... (Need ${saHoldEnabled ? '4s' : '≥3s'} vocal data)`}
      </button>
    </div>
  );
};
