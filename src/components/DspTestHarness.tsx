import { useState, useRef, useCallback } from 'react';
import { AudioEngine } from '../audio/audio-engine';
import { detectScale, type PitchFrame, type ScaleDetectionResult } from '../audio/scale-detector';
import { centError, frameAccuracy, getTargetFrequency, type Condition } from '../audio/accuracy';
import type { CalibrationResult } from '../audio/calibration';
import { MusicNoteIcon, AlertTriangleIcon, MicIcon } from './common/Icons';

/**
 * DSP Test Harness — Phase 0 Deliverable
 *
 * A standalone page for visually verifying the entire audio pipeline:
 *  - Mic permission & device info
 *  - Noise-floor calibration
 *  - Live f0 display from YIN worklet
 *  - Scale / Sa detection
 *  - Accuracy scoring against a selected condition
 */

const CONDITIONS: Condition[] = ['diabetes', 'thyroid', 'hypertension'];

export default function DspTestHarness() {
  // ── State ────────────────────────────────────────────────────────────────
  const engineRef = useRef<AudioEngine | null>(null);
  const [micGranted, setMicGranted] = useState(false);
  const [engineState, setEngineState] = useState('idle');
  const [micSettings, setMicSettings] = useState<MediaTrackSettings | null>(null);
  const [calibration, setCalibration] = useState<CalibrationResult | null>(null);
  const [calibProgress, setCalibProgress] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [currentFrame, setCurrentFrame] = useState<PitchFrame | null>(null);
  const [frameLog, setFrameLog] = useState<PitchFrame[]>([]);
  const [scaleResult, setScaleResult] = useState<ScaleDetectionResult | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<Condition>('diabetes');
  const [error, setError] = useState<string | null>(null);

  // ── Engine Setup ─────────────────────────────────────────────────────────
  const initEngine = useCallback(() => {
    const engine = new AudioEngine({
      onStateChange: (state) => setEngineState(state),
      onPitchFrame: (frame) => {
        setCurrentFrame(frame);
        setFrameLog((prev) => [...prev.slice(-500), frame]); // keep last 500
      },
      onCalibrationDone: (result) => setCalibration(result),
      onError: (err) => setError(err.message),
    });
    engineRef.current = engine;
    return engine;
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleRequestMic = async () => {
    setError(null);
    const engine = initEngine();
    await engine.requestMic();
    if (engine.getState() !== 'error') {
      setMicGranted(true);
      setMicSettings(engine.getStreamSettings());
    }
  };

  const handleCalibrate = async () => {
    setError(null);
    setCalibProgress(0);
    await engineRef.current?.calibrate((p) => setCalibProgress(p));
  };

  const handleStartListening = () => {
    setError(null);
    setFrameLog([]);
    setCurrentFrame(null);
    engineRef.current?.startListening();
    setIsListening(true);
  };

  const handleStopListening = () => {
    engineRef.current?.stopListening();
    setIsListening(false);
  };

  const handleDetectScale = () => {
    const frames = engineRef.current?.getPitchFrames() ?? [];
    if (frames.length === 0) {
      setError('No pitch frames captured. Start listening first.');
      return;
    }
    const result = detectScale(frames);
    setScaleResult(result);
  };

  const handleDestroy = async () => {
    await engineRef.current?.destroy();
    engineRef.current = null;
    setMicGranted(false);
    setCalibration(null);
    setIsListening(false);
    setCurrentFrame(null);
    setFrameLog([]);
    setScaleResult(null);
  };

  // ── Derived Values ───────────────────────────────────────────────────────
  const targetHz = scaleResult
    ? getTargetFrequency(scaleResult.saFrequency, selectedCondition)
    : null;

  const currentAccuracy =
    currentFrame && targetHz && currentFrame.f0 > 0
      ? frameAccuracy(currentFrame.f0, targetHz)
      : null;

  const currentCents =
    currentFrame && targetHz && currentFrame.f0 > 0
      ? centError(currentFrame.f0, targetHz)
      : null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '24px',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#e0e0e0',
      background: '#0f0f14',
      minHeight: '100vh',
    }}>
      <h1 style={{ fontSize: '28px', marginBottom: '8px', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <MusicNoteIcon size={24} />
        <span>DSP Test Harness</span>
      </h1>
      <p style={{ color: '#888', marginBottom: '32px' }}>
        Phase 0 — Audio pipeline verification for Music Mantra (Swara Healing)
      </p>

      {error && (
        <div style={{
          background: '#3b1010',
          border: '1px solid #ef4444',
          color: '#fca5a5',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}>
          <AlertTriangleIcon size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ── Section 1: Microphone ── */}
      <Section title="1. Microphone Access" status={micGranted ? 'Granted' : 'Pending'}>
        {!micGranted ? (
          <button onClick={handleRequestMic} style={{ ...btnStyle, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <MicIcon size={16} /> Request Microphone
          </button>
        ) : (
          <div>
            <p>Engine State: <code>{engineState}</code></p>
            {micSettings && (
              <table style={tableStyle}>
                <tbody>
                  <tr><td>Echo Cancellation</td><td>{String(micSettings.echoCancellation)}</td></tr>
                  <tr><td>Noise Suppression</td><td>{String(micSettings.noiseSuppression)}</td></tr>
                  <tr><td>Auto Gain Control</td><td>{String(micSettings.autoGainControl)}</td></tr>
                  <tr><td>Sample Rate</td><td>{micSettings.sampleRate} Hz</td></tr>
                  <tr><td>Channel Count</td><td>{micSettings.channelCount}</td></tr>
                </tbody>
              </table>
            )}
          </div>
        )}
      </Section>

      {/* ── Section 2: Calibration ── */}
      <Section
        title="2. Noise-Floor Calibration"
        status={calibration ? (calibration.tooNoisy ? 'Too Noisy' : 'Done') : 'Pending'}
      >
        {micGranted && !calibration && (
          <div>
            <button onClick={handleCalibrate} style={btnStyle}>
              Start Calibration (3s silence)
            </button>
            {calibProgress > 0 && (
              <div style={{ marginTop: '12px' }}>
                <div style={progressBarBg}>
                  <div style={{ ...progressBarFill, width: `${calibProgress * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        )}
        {calibration && (
          <table style={tableStyle}>
            <tbody>
              <tr><td>Noise Gate (RMS)</td><td>{calibration.noiseGate.toFixed(6)}</td></tr>
              <tr><td>Noise P95 (RMS)</td><td>{calibration.noiseP95.toFixed(6)}</td></tr>
              <tr><td>Noise Mean (RMS)</td><td>{calibration.noiseMean.toFixed(6)}</td></tr>
              <tr>
                <td>Environment</td>
                <td style={{ color: calibration.tooNoisy ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                  {calibration.tooNoisy ? 'Too Noisy' : 'Quiet Enough'}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </Section>

      {/* ── Section 3: Live Pitch ── */}
      <Section title="3. Live Pitch Detection (YIN)" status={isListening ? 'Recording' : 'Stopped'}>
        {micGranted && calibration && (
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              {!isListening ? (
                <button onClick={handleStartListening} style={btnStyle}>
                  Start Listening
                </button>
              ) : (
                <button onClick={handleStopListening} style={{ ...btnStyle, background: '#dc2626' }}>
                  Stop Listening
                </button>
              )}
            </div>

            {currentFrame && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                marginBottom: '16px',
              }}>
                <MetricCard
                  label="Frequency"
                  value={currentFrame.f0 > 0 ? `${currentFrame.f0.toFixed(1)} Hz` : 'Unvoiced'}
                  color={currentFrame.f0 > 0 ? '#22c55e' : '#888'}
                />
                <MetricCard
                  label="Confidence"
                  value={`${(currentFrame.conf * 100).toFixed(0)}%`}
                  color={currentFrame.conf > 0.85 ? '#22c55e' : '#f59e0b'}
                />
                <MetricCard
                  label="Time"
                  value={`${currentFrame.t.toFixed(2)}s`}
                  color="#a78bfa"
                />
              </div>
            )}

            <p style={{ color: '#888', fontSize: '14px' }}>
              Voiced frames captured: {frameLog.filter(f => f.f0 > 0).length} / {frameLog.length} total
            </p>
          </div>
        )}
      </Section>

      {/* ── Section 4: Scale Detection ── */}
      <Section title="4. Scale & Sa Detection" status={scaleResult ? 'Detected' : 'Pending'}>
        {micGranted && calibration && (
          <div>
            <button onClick={handleDetectScale} style={{ ...btnStyle, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <MusicNoteIcon size={16} /> Detect Scale from Captured Frames
            </button>

            {scaleResult && (
              <div style={{ marginTop: '16px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '16px',
                  marginBottom: '16px',
                }}>
                  <MetricCard
                    label="Detected Scale"
                    value={`${scaleResult.tonic} ${scaleResult.mode}`}
                    color="#a78bfa"
                  />
                  <MetricCard
                    label="Sa Frequency"
                    value={`${scaleResult.saFrequency.toFixed(1)} Hz`}
                    color="#22c55e"
                  />
                  <MetricCard
                    label="Confidence"
                    value={`${(scaleResult.confidence * 100).toFixed(1)}%`}
                    color={scaleResult.lowConfidence ? '#ef4444' : '#22c55e'}
                  />
                </div>

                {scaleResult.lowConfidence && (
                  <div style={{
                    background: '#3b2a10',
                    border: '1px solid #f59e0b',
                    color: '#fbbf24',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}>
                    <AlertTriangleIcon size={16} />
                    <span>Low confidence — consider singing a longer or more tonal phrase.</span>
                  </div>
                )}

                <p style={{ color: '#888', fontSize: '14px' }}>
                  Runner-up: {scaleResult.runnerUp.tonic} {scaleResult.runnerUp.mode}{' '}
                  ({(scaleResult.runnerUp.confidence * 100).toFixed(1)}%)
                </p>

                <h4 style={{ marginTop: '16px', color: '#ccc' }}>Chroma Histogram</h4>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '80px' }}>
                  {scaleResult.chromaHistogram.map((val, i) => (
                    <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{
                        background: i === scaleResult.tonicPitchClass ? '#a78bfa' : '#4b5563',
                        height: `${val * 70}px`,
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s',
                      }} />
                      <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
                        {['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][i]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ── Section 5: Accuracy Test ── */}
      <Section title="5. Live Accuracy Test" status={targetHz ? 'Ready' : 'Needs scale detection'}>
        {scaleResult && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#888', marginRight: '12px' }}>Condition:</label>
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCondition(c)}
                  style={{
                    ...btnStyle,
                    background: selectedCondition === c ? '#7c3aed' : '#374151',
                    marginRight: '8px',
                    padding: '6px 16px',
                    fontSize: '13px',
                  }}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>

            {targetHz && (
              <div>
                <p style={{ color: '#888', marginBottom: '16px' }}>
                  Target: <strong style={{ color: '#a78bfa' }}>{targetHz.toFixed(1)} Hz</strong>{' '}
                  (Sa {scaleResult.saFrequency.toFixed(1)} Hz × {selectedCondition} ratio)
                </p>

                {currentAccuracy !== null && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '16px',
                  }}>
                    <MetricCard
                      label="Accuracy"
                      value={`${currentAccuracy.toFixed(1)}%`}
                      color={currentAccuracy >= 90 ? '#22c55e' : currentAccuracy >= 70 ? '#f59e0b' : '#ef4444'}
                    />
                    <MetricCard
                      label="Cent Error"
                      value={`${currentCents !== null ? currentCents.toFixed(1) : '—'} ¢`}
                      color="#a78bfa"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ── Cleanup ── */}
      {micGranted && (
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button onClick={handleDestroy} style={{ ...btnStyle, background: '#6b7280' }}>
            Destroy Engine & Release Mic
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Reusable Components ─────────────────────────────────────────────────────

function Section({
  title,
  status,
  children,
}: {
  title: string;
  status: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: '#1a1a24',
      border: '1px solid #2a2a3a',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <h2 style={{ fontSize: '18px', color: '#e0e0e0', margin: 0 }}>{title}</h2>
        <span style={{ fontSize: '13px', color: '#888' }}>{status}</span>
      </div>
      {children}
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div style={{
      background: '#0f0f18',
      border: '1px solid #2a2a3a',
      borderRadius: '10px',
      padding: '16px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const btnStyle: React.CSSProperties = {
  background: '#7c3aed',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  padding: '10px 20px',
  fontSize: '14px',
  cursor: 'pointer',
  fontWeight: 600,
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '14px',
  marginTop: '12px',
};

const progressBarBg: React.CSSProperties = {
  width: '100%',
  height: '8px',
  background: '#2a2a3a',
  borderRadius: '4px',
  overflow: 'hidden',
};

const progressBarFill: React.CSSProperties = {
  height: '100%',
  background: '#7c3aed',
  borderRadius: '4px',
  transition: 'width 0.2s',
};
