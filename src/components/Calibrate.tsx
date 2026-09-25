import React, { useEffect, useState, useCallback } from 'react';
import type { CalibrationResult } from '../audio/calibration';
import { AudioEngine } from '../audio/audio-engine';

interface CalibrateProps {
  onCalibrationDone: (result: CalibrationResult) => void;
  onCalibrationFailed: (message: string) => void;
}

export const Calibrate: React.FC<CalibrateProps> = ({
  onCalibrationDone,
  onCalibrationFailed
}) => {
  const [progress, setProgress] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationResult, setCalibrationResult] = useState<CalibrationResult | null>(null);

  const startCalibration = useCallback(async () => {
    setIsCalibrating(true);
    setProgress(0);
    setCalibrationResult(null);

    try {
      const engine = new AudioEngine({
        onCalibrationDone: (res) => {
          setCalibrationResult(res);
        },
        onError: (err) => {
          onCalibrationFailed(err.message);
        }
      });

      await engine.requestMic();
      const result = await engine.calibrate((p) => {
        setProgress(Math.round(p * 100));
      });

      setIsCalibrating(false);

      if (result) {
        setCalibrationResult(result);
        if (!result.tooNoisy) {
          setTimeout(() => {
            onCalibrationDone(result);
          }, 1200);
        }
      } else {
        onCalibrationFailed('Calibration failed to return a result.');
      }
    } catch (err: unknown) {
      setIsCalibrating(false);
      const msg = err instanceof Error ? err.message : 'Failed to calibrate noise floor.';
      onCalibrationFailed(msg);
    }
  }, [onCalibrationDone, onCalibrationFailed]);

  useEffect(() => {
    startCalibration();
  }, [startCalibration]);

  return (
    <div className="calibrate-screen card" style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
        Step 1: Noise-Floor Calibration
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Please remain quiet for 3 seconds while we measure ambient room background noise.
      </p>

      {/* Animation & Progress Bar */}
      <div style={{ maxWidth: '400px', margin: '0 auto 2rem auto' }}>
        <div
          style={{
            height: '16px',
            background: '#334155',
            borderRadius: '8px',
            overflow: 'hidden',
            marginBottom: '0.5rem'
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: 'var(--accent-primary)',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {isCalibrating ? `Calibrating background noise... ${progress}%` : progress === 100 ? 'Calibration complete!' : 'Ready'}
        </div>
      </div>

      {/* Calibration Result */}
      {calibrationResult && (
        <div style={{ marginTop: '1.5rem', textAlign: 'left', maxWidth: '450px', margin: '1.5rem auto', background: '#0f172a', padding: '1rem', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Noise Floor (p95):</span>
            <span style={{ fontWeight: 600 }}>{(calibrationResult.noiseP95 * 1000).toFixed(2)} mRMS</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Noise Gate:</span>
            <span style={{ fontWeight: 600 }}>{(calibrationResult.noiseGate * 1000).toFixed(2)} mRMS</span>
          </div>

          {calibrationResult.tooNoisy ? (
            <div style={{ marginTop: '1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--danger)', padding: '0.75rem', borderRadius: '6px', color: '#fca5a5' }}>
              ⚠️ Room background noise is too high ({(calibrationResult.noiseP95 * 1000).toFixed(1)} mRMS &gt; 50 mRMS limit). Please move to a quieter room and try again.
            </div>
          ) : (
            <div style={{ marginTop: '1rem', color: 'var(--success)', fontWeight: 600, textAlign: 'center' }}>
              ✓ Room noise floor is quiet and calibrated successfully!
            </div>
          )}
        </div>
      )}

      {calibrationResult?.tooNoisy && (
        <button className="btn-primary" onClick={startCalibration}>
          Retry Noise Calibration
        </button>
      )}
    </div>
  );
};
