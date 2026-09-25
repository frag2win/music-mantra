import React from 'react';
import { useMachine } from '@xstate/react';
import { appMachine } from './machine/app-machine';
import { Welcome } from './components/Welcome';
import { Calibrate } from './components/Calibrate';
import { Sing } from './components/Sing';
import { ScaleResult } from './components/ScaleResult';
import { ConditionMenu } from './components/ConditionMenu';
import { Listen } from './components/Listen';
import { ChantEval } from './components/ChantEval';
import { ChantHold } from './components/ChantHold';
import { SessionDone } from './components/SessionDone';
import { History } from './components/History';
import { Retry } from './components/Retry';
import { RetryShort } from './components/RetryShort';
import DspTestHarness from './components/DspTestHarness';
import { AuthModal } from './components/common/AuthModal';
import { apiClient } from './api/client';

export const App: React.FC = () => {
  const [snapshot, send] = useMachine(appMachine);
  const [showHarness, setShowHarness] = React.useState(false);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(apiClient.isAuthenticated());

  const state = snapshot.value;
  const context = snapshot.context;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 0',
          borderBottom: '1px solid #334155',
          marginBottom: '1.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🧘</span>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Swara Healing
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Chakra Music Mantra Therapy (Web v0.2)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ background: '#1e293b', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #334155' }}>
            Day {context.activeDay} of {context.totalProgramDays}
          </div>

          <button
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => setShowAuthModal(true)}
          >
            {isAuthenticated ? '👤 Account' : '🔑 Sign In'}
          </button>

          <button
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
            onClick={() => setShowHarness(!showHarness)}
          >
            {showHarness ? '← Back to App' : '🛠 DSP Harness'}
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main style={{ flex: 1 }}>
        {showHarness ? (
          <DspTestHarness />
        ) : (
          <>
            {state === 'welcome' && (
              <Welcome
                activeDay={context.activeDay}
                totalDays={context.totalProgramDays}
                disclaimerAccepted={context.disclaimerAccepted}
                onAcceptDisclaimer={() => send({ type: 'ACCEPT_DISCLAIMER' })}
                onStartProgram={() => send({ type: 'START_PROGRAM' })}
                onViewHistory={() => send({ type: 'VIEW_HISTORY' })}
              />
            )}

            {state === 'mic_permission' && (
              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }}>
                  Microphone Access Required
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Swara Healing uses your device microphone to analyze pitch accuracy locally. Audio is processed entirely inside your browser and is never uploaded or recorded.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button className="btn-primary" onClick={() => send({ type: 'MIC_GRANTED' })}>
                    Grant Microphone Access
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => send({ type: 'MIC_DENIED', message: 'User denied microphone permission' })}
                  >
                    Deny
                  </button>
                </div>
              </div>
            )}

            {state === 'error_mic' && (
              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
                  Microphone Permission Error
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  {context.errorMessage || 'Unable to access microphone. Please enable mic permissions in your browser settings.'}
                </p>
                <button className="btn-primary" onClick={() => send({ type: 'RETRY_PERMISSIONS' })}>
                  Try Again
                </button>
              </div>
            )}

            {state === 'calibrate' && (
              <Calibrate
                onCalibrationDone={(result) => send({ type: 'CALIBRATION_DONE', result })}
                onCalibrationFailed={(message) => send({ type: 'CALIBRATION_FAILED', message })}
              />
            )}

            {state === 'error_calibration' && (
              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>
                  Calibration Failed
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Room background noise was too high or microphone stream was interrupted.
                </p>
                <button className="btn-primary" onClick={() => send({ type: 'RETRY_CALIBRATION' })}>
                  Retry Calibration
                </button>
              </div>
            )}

            {state === 'sing' && (
              <Sing
                onSingingComplete={(result) => send({ type: 'SINGING_COMPLETE', result })}
                onRetrySinging={() => send({ type: 'RETRY_SINGING' })}
              />
            )}

            {state === 'scale_result' && (
              <ScaleResult
                scaleResult={context.scaleResult}
                selectedSaNote={context.selectedSaNote}
                selectedSaHz={context.selectedSaHz}
                saHoldEnabled={context.saHoldEnabled}
                onOverrideSa={(saNote, saHz) => send({ type: 'OVERRIDE_SA', saNote, saHz })}
                onToggleSaHold={() => send({ type: 'TOGGLE_SA_HOLD' })}
                onConfirmScale={() => send({ type: 'CONFIRM_SCALE' })}
                onRetrySinging={() => send({ type: 'RETRY_SINGING' })}
              />
            )}

            {state === 'menu' && (
              <ConditionMenu
                selectedSaNote={context.selectedSaNote || 'C'}
                selectedSaHz={context.selectedSaHz || 261.63}
                onSelectCondition={(condition) => send({ type: 'SELECT_CONDITION', condition })}
                onReSing={() => send({ type: 'RETRY_SINGING' })}
              />
            )}

            {state === 'listen' && context.selectedCondition && (
              <Listen
                condition={context.selectedCondition}
                saNote={context.selectedSaNote || 'C'}
                saHz={context.selectedSaHz || 261.63}
                onStartChanting={() => send({ type: 'START_CHANTING' })}
                onChangeCondition={() => send({ type: 'CONFIRM_SCALE' })}
              />
            )}

            {state === 'chant_eval' && context.selectedCondition && (
              <ChantEval
                condition={context.selectedCondition}
                saNote={context.selectedSaNote || 'C'}
                saHz={context.selectedSaHz || 261.63}
                onEvalPassed={(finalAcc) => send({ type: 'EVAL_PASSED', finalAccuracy: finalAcc })}
                onEvalFailed={(finalAcc) => send({ type: 'EVAL_FAILED', finalAccuracy: finalAcc })}
              />
            )}

            {state === 'retry' && (
              <Retry
                evalAccuracy={context.evalAccuracy}
                onAcknowledgeRetry={() => send({ type: 'ACKNOWLEDGE_RETRY' })}
              />
            )}

            {state === 'chant_hold' && context.selectedCondition && (
              <ChantHold
                condition={context.selectedCondition}
                saNote={context.selectedSaNote || 'C'}
                saHz={context.selectedSaHz || 261.63}
                activeDay={context.activeDay}
                evalAccuracy={context.evalAccuracy}
                onHoldPassed={(session) => {
                  apiClient.saveSession(session).catch((err) => console.warn('Could not persist session to backend:', err));
                  send({ type: 'HOLD_PASSED', session });
                }}
                onHoldFailed={() => send({ type: 'HOLD_FAILED' })}
                onPause={() => send({ type: 'PAUSE' })}
              />
            )}

            {state === 'retry_short' && (
              <RetryShort
                voicedSeconds={context.voicedSeconds}
                onAcknowledgeRetry={() => send({ type: 'ACKNOWLEDGE_RETRY' })}
              />
            )}

            {state === 'session_done' && (
              <SessionDone
                session={context.sessionHistory[0] || null}
                activeDay={context.activeDay}
                totalDays={context.totalProgramDays}
                onGoHome={() => send({ type: 'GO_HOME' })}
                onViewHistory={() => send({ type: 'VIEW_HISTORY' })}
              />
            )}

            {state === 'history' && (
              <History
                history={context.sessionHistory}
                activeDay={context.activeDay}
                totalDays={context.totalProgramDays}
                onBack={() => send({ type: 'BACK_TO_APP' })}
              />
            )}

            {state === 'paused' && (
              <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--warning)', marginBottom: '1rem' }}>
                  Session Paused
                </h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Audio recording or screen focus was interrupted. You can resume your session or discard it.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button className="btn-primary" onClick={() => send({ type: 'RESUME' })}>
                    Resume Session
                  </button>
                  <button className="btn-secondary" onClick={() => send({ type: 'DISCARD' })}>
                    Discard Session
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Auth & Profile Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthChange={() => setIsAuthenticated(apiClient.isAuthenticated())}
      />

      {/* Footer */}
      <footer style={{ marginTop: '2rem', padding: '1rem 0', borderTop: '1px solid #334155', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        Music Mantra — Swara Healing Web · Client-Side DSP Engine · Confidential & Private
      </footer>
    </div>
  );
};

export default App;
