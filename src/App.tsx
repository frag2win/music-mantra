import React from 'react';
import { useMachine } from '@xstate/react';
import {
  createAppMachine,
  INITIAL_CONTEXT,
  canGoBack,
  getBackDestinationTitle
} from './machine/app-machine';
import {
  persistNavigationState,
  loadPersistedContext,
  loadPersistedState
} from './utils/navigation-storage';
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
import { BetaFeedbackModal } from './components/common/BetaFeedbackModal';
import { apiClient } from './api/client';
import { useI18n, LanguageSwitcher } from './i18n/I18nContext';
import { ThemeProvider } from './theme/ThemeProvider';
import { ChakraBackdrop } from './components/animations/ChakraBackdrop';
import { LotusIntro, useLotusIntro } from './components/animations/LotusIntro';

import {
  LotusIcon,
  FlaskIcon,
  UserIcon,
  KeyIcon,
  WrenchIcon,
  ScaleIcon,
  ArrowLeftIcon
} from './components/common/Icons';

export const App: React.FC = () => {
  const { t } = useI18n();
  const { shouldShow: showIntro, handleComplete: handleIntroComplete, dashboardEntrance } = useLotusIntro();

  // Load and hydrate persisted context and navigation state
  const initialContext = React.useMemo(() => loadPersistedContext(INITIAL_CONTEXT), []);
  const initialState = React.useMemo(() => loadPersistedState(), []);
  const machine = React.useMemo(() => createAppMachine(initialContext, initialState || undefined), []);
  const [snapshot, send] = useMachine(machine);

  const [showHarness, setShowHarness] = React.useState(false);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [showBetaModal, setShowBetaModal] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(apiClient.isAuthenticated());

  const state = snapshot.value;
  const context = snapshot.context;

  // Reusable Go-Back handler
  const handleGoBack = React.useCallback(() => {
    send({ type: 'GO_BACK' });
  }, [send]);

  // Synchronize browser history and persist context/state
  React.useEffect(() => {
    const stateStr = String(state);
    persistNavigationState(stateStr, context);

    const targetHash = `#${stateStr}`;
    if (window.location.hash !== targetHash) {
      window.history.pushState({ appState: stateStr }, '', targetHash);
    }
  }, [state, context]);

  // Connect native browser back/forward buttons (window.onpopstate)
  React.useEffect(() => {
    const handlePopState = () => {
      send({ type: 'GO_BACK' });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [send]);

  return (
    <ThemeProvider activeCondition={context.selectedCondition}>
      {/* Lotus Intro — cinematic first-visit animation */}
      {showIntro && <LotusIntro onComplete={handleIntroComplete} />}

      {/* Full-viewport ambient background sitting behind all screens at 60fps */}
      <ChakraBackdrop variant="fullscreen" />
      <div className={dashboardEntrance ? 'dashboard-entrance' : ''} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Top Navbar */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Universal Header Back Button */}
          {canGoBack(String(state)) && (
            <button
              type="button"
              className="btn-back"
              onClick={handleGoBack}
              aria-label={getBackDestinationTitle(String(state), context)}
              title={getBackDestinationTitle(String(state), context)}
            >
              <ArrowLeftIcon size={16} />
              <span>{getBackDestinationTitle(String(state), context)}</span>
            </button>
          )}

          <LotusIcon size={28} color="var(--chakra-theme-accent, var(--accent-primary))" />
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {t('app.title')}
            </h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {t('app.subtitle')}
            </span>
          </div>
        </div>

        <div className="app-header-controls">
          <LanguageSwitcher />

          <div
            style={{
              background: 'rgba(30, 41, 59, 0.75)',
              padding: '0.42rem 0.9rem',
              borderRadius: '16px 3px 16px 3px',
              fontSize: '0.82rem',
              fontWeight: 600,
              border: '1px solid rgba(255, 255, 255, 0.16)',
              color: 'var(--text-primary)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
            }}
          >
            {t('app.dayProgress', { day: context.activeDay })}
          </div>

          <button
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '0.42rem 0.85rem', display: 'inline-flex', alignItems: 'center' }}
            onClick={() => setShowBetaModal(true)}
            title="Inspect device diagnostics and submit beta feedback"
          >
            <FlaskIcon size={14} style={{ marginRight: '0.4rem' }} /> Feedback
          </button>

          <button
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '0.42rem 0.85rem', display: 'inline-flex', alignItems: 'center' }}
            onClick={() => setShowAuthModal(true)}
          >
            {isAuthenticated ? (
              <>
                <UserIcon size={14} style={{ marginRight: '0.4rem' }} /> Account
              </>
            ) : (
              <>
                <KeyIcon size={14} style={{ marginRight: '0.4rem' }} /> Sign In
              </>
            )}
          </button>

          <button
            className="btn-secondary"
            style={{ fontSize: '0.82rem', padding: '0.42rem 0.85rem', display: 'inline-flex', alignItems: 'center' }}
            onClick={() => setShowHarness(!showHarness)}
          >
            {showHarness ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <ArrowLeftIcon size={14} /> Back to App
              </span>
            ) : (
              <>
                <WrenchIcon size={14} style={{ marginRight: '0.4rem' }} /> DSP Harness
              </>
            )}
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
                  <button
                    className="btn-secondary"
                    onClick={handleGoBack}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <ArrowLeftIcon size={16} /> Back
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
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button className="btn-primary" onClick={() => send({ type: 'RETRY_PERMISSIONS' })}>
                    Try Again
                  </button>
                  <button className="btn-secondary" onClick={handleGoBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ArrowLeftIcon size={16} /> Back to Welcome
                  </button>
                </div>
              </div>
            )}

            {state === 'calibrate' && (
              <Calibrate
                onCalibrationDone={(result) => send({ type: 'CALIBRATION_DONE', result })}
                onCalibrationFailed={(message) => send({ type: 'CALIBRATION_FAILED', message })}
                onBack={handleGoBack}
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
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button className="btn-primary" onClick={() => send({ type: 'RETRY_CALIBRATION' })}>
                    Retry Calibration
                  </button>
                  <button className="btn-secondary" onClick={handleGoBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ArrowLeftIcon size={16} /> Back
                  </button>
                </div>
              </div>
            )}

            {state === 'sing' && (
              <Sing
                saHoldEnabled={context.saHoldEnabled}
                onSingingComplete={(result) => send({ type: 'SINGING_COMPLETE', result })}
                onRetrySinging={() => send({ type: 'RETRY_SINGING' })}
                onBack={handleGoBack}
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
                onBack={handleGoBack}
              />
            )}

            {state === 'menu' && (
              <ConditionMenu
                selectedSaNote={context.selectedSaNote || 'C'}
                selectedSaHz={context.selectedSaHz || 261.63}
                selectedCondition={context.selectedCondition}
                onSelectCondition={(condition) => send({ type: 'SELECT_CONDITION', condition })}
                onReSing={() => send({ type: 'RETRY_SINGING' })}
                onBack={handleGoBack}
              />
            )}

            {state === 'listen' && (
              <Listen
                condition={context.selectedCondition || 'diabetes'}
                saNote={context.selectedSaNote || 'C'}
                saHz={context.selectedSaHz || 261.63}
                onStartChanting={() => send({ type: 'START_CHANTING' })}
                onChangeCondition={() => send({ type: 'CHANGE_CONDITION' })}
                onBack={handleGoBack}
              />
            )}

            {state === 'chant_eval' && (
              <ChantEval
                condition={context.selectedCondition || 'diabetes'}
                saNote={context.selectedSaNote || 'C'}
                saHz={context.selectedSaHz || 261.63}
                onEvalPassed={(finalAcc) => send({ type: 'EVAL_PASSED', finalAccuracy: finalAcc })}
                onEvalFailed={(finalAcc) => send({ type: 'EVAL_FAILED', finalAccuracy: finalAcc })}
                onBack={handleGoBack}
              />
            )}

            {state === 'retry' && (
              <Retry
                evalAccuracy={context.evalAccuracy}
                onAcknowledgeRetry={() => send({ type: 'ACKNOWLEDGE_RETRY' })}
                onBack={handleGoBack}
              />
            )}

            {state === 'chant_hold' && (
              <ChantHold
                condition={context.selectedCondition || 'diabetes'}
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
                onBack={handleGoBack}
              />
            )}

            {state === 'retry_short' && (
              <RetryShort
                voicedSeconds={context.voicedSeconds}
                onAcknowledgeRetry={() => send({ type: 'ACKNOWLEDGE_RETRY' })}
                onBack={handleGoBack}
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
                  <button className="btn-secondary" onClick={handleGoBack} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ArrowLeftIcon size={16} /> Back to Mantra
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

      {/* Beta Feedback & Diagnostics Modal */}
      <BetaFeedbackModal
        isOpen={showBetaModal}
        onClose={() => setShowBetaModal(false)}
      />

      {/* Persistent Medical Disclaimer & Footer */}
      <footer
        role="contentinfo"
        style={{
          marginTop: '2rem',
          padding: '1.25rem 1rem',
          borderTop: '1px solid #334155',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          background: 'rgba(15, 23, 42, 0.6)'
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto 0.75rem auto', color: '#94a3b8', fontSize: '0.75rem', lineHeight: '1.4', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
          <ScaleIcon size={14} style={{ color: '#94a3b8' }} />
          <span><strong>{t('app.medicalDisclaimer')}</strong></span>
        </div>
        <div>
          Music Mantra — Swara Healing Web · Client-Side DSP Engine · Confidential & Private
        </div>
      </footer>
    </div>
    </ThemeProvider>
  );
};

export default App;
