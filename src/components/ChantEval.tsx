import React, { useEffect, useState, useRef } from 'react';
import type { HealthCondition } from '../types';
import { CONDITION_DETAILS } from '../types';
import { AudioEngine } from '../audio/audio-engine';
import { centError as calcCentError, centToAccuracy, evaluationGatePassed } from '../audio/accuracy';
import type { PitchFrame } from '../audio/scale-detector';
import { PitchMeter } from './common/PitchMeter';
import { wakeLockManager } from '../utils/wake-lock';

interface ChantEvalProps {
  condition: HealthCondition;
  saNote: string;
  saHz: number;
  onEvalPassed: (finalAccuracy: number) => void;
  onEvalFailed: (finalAccuracy: number) => void;
}

export const ChantEval: React.FC<ChantEvalProps> = ({
  condition,
  saHz,
  onEvalPassed,
  onEvalFailed
}) => {
  const detail = CONDITION_DETAILS[condition];
  const targetHz = saHz * detail.ratio;

  const [currentAccuracy, setCurrentAccuracy] = useState(0);
  const [voicedSeconds, setVoicedSeconds] = useState(0);
  const [currentNote, setCurrentNote] = useState<string>('--');
  const [currentHz, setCurrentHz] = useState<number | undefined>(undefined);
  const [centErr, setCentErr] = useState<number>(0);

  const pitchFramesRef = useRef<PitchFrame[]>([]);
  const isFinishedRef = useRef(false);
  const engineRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    isFinishedRef.current = false;
    pitchFramesRef.current = [];
    wakeLockManager.acquire();

    const engine = new AudioEngine({
      onPitchFrame: (frame: PitchFrame) => {
        if (isFinishedRef.current) return;

        if (frame.conf > 0.6 && frame.f0 > 70 && frame.f0 < 800) {
          const errCents = calcCentError(frame.f0, targetHz);

          pitchFramesRef.current.push(frame);

          // Convert f0 to note name
          const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
          const midi = Math.round(69 + 12 * Math.log2(frame.f0 / 440));
          const noteName = noteNames[((midi % 12) + 12) % 12];
          const octave = Math.floor(midi / 12) - 1;

          setCurrentNote(`${noteName}${octave}`);
          setCurrentHz(frame.f0);
          setCentErr(errCents);

          // Rolling 2-second window accuracy calculation (FR-7)
          const nowSec = performance.now() / 1000;
          const rollingFrames = pitchFramesRef.current.filter((f) => nowSec - f.t <= 2.0);
          if (rollingFrames.length > 0) {
            const sumAcc = rollingFrames.reduce((acc, f) => acc + centToAccuracy(calcCentError(f.f0, targetHz)), 0);
            setCurrentAccuracy(sumAcc / rollingFrames.length);
          }

          const totalVoiced = pitchFramesRef.current.length * 0.0116; // ~11.6ms per frame
          setVoicedSeconds(totalVoiced);

          // Evaluation Gate Check (FR-8): after 7.5 seconds of voiced chanting
          if (totalVoiced >= 7.5 && !isFinishedRef.current) {
            isFinishedRef.current = true;
            engine.stopListening();

            const gate = evaluationGatePassed(pitchFramesRef.current, targetHz, { passThreshold: 90, evalVoicedSeconds: 7.5 });

            if (gate.passed) {
              onEvalPassed(gate.accuracy);
            } else {
              onEvalFailed(gate.accuracy);
            }
          }
        }
      }
    });

    engineRef.current = engine;

    engine.requestMic().then(() => {
      engine.startListening();
    }).catch((err: unknown) => {
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
      <h2 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
        Step 5: Initial Pitch Accuracy Evaluation
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Chant <strong>"{detail.mantra}"</strong> continuously for 7.5 seconds to pass accuracy evaluation (Target ≥90%)
      </p>

      {/* FR-7 Live Accuracy Display */}
      <div style={{ margin: '1rem 0' }}>
        <PitchMeter
          currentAccuracy={currentAccuracy}
          targetNote={targetNoteName}
          targetHz={targetHz}
          currentNote={currentNote}
          currentHz={currentHz}
          centError={centErr}
          label="Live Chanting Accuracy"
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
    </div>
  );
};
