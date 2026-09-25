import { describe, it, expect, beforeEach } from 'vitest';
import { createActor } from 'xstate';
import {
  appMachine,
  createAppMachine,
  canGoBack,
  getBackDestinationTitle,
  INITIAL_CONTEXT
} from '../../src/machine/app-machine';
import {
  persistNavigationState,
  loadPersistedContext,
  loadPersistedState,
  clearNavigationState
} from '../../src/utils/navigation-storage';

describe('Navigation & Back History Workflow', () => {
  it('correctly reports canGoBack and destination titles', () => {
    expect(canGoBack('welcome')).toBe(false);
    expect(canGoBack('menu')).toBe(true);
    expect(canGoBack('listen')).toBe(true);
    expect(canGoBack('chant_eval')).toBe(true);
    expect(canGoBack('sing')).toBe(true);
    expect(canGoBack('scale_result')).toBe(true);

    expect(getBackDestinationTitle('menu', { ...INITIAL_CONTEXT, scaleResult: {} as any })).toBe('Back to Scale Tuning');
    expect(getBackDestinationTitle('listen')).toBe('Back to Conditions');
    expect(getBackDestinationTitle('chant_eval')).toBe('Back to Mantra Preview');
    expect(getBackDestinationTitle('sing')).toBe('Back to Calibration');
    expect(getBackDestinationTitle('scale_result')).toBe('Back to Sing');
  });

  it('supports full forward and backward transitions without data loss', () => {
    const actor = createActor(appMachine).start();

    // 1. Welcome -> Mic Permission
    actor.send({ type: 'ACCEPT_DISCLAIMER' });
    actor.send({ type: 'START_PROGRAM' });
    expect(actor.getSnapshot().value).toBe('mic_permission');

    // Back from mic permission to welcome
    actor.send({ type: 'GO_BACK' });
    expect(actor.getSnapshot().value).toBe('welcome');
    expect(actor.getSnapshot().context.disclaimerAccepted).toBe(true);

    // Forward to Calibrate
    actor.send({ type: 'START_PROGRAM' });
    actor.send({ type: 'MIC_GRANTED' });
    expect(actor.getSnapshot().value).toBe('calibrate');

    // Back from Calibrate to Welcome
    actor.send({ type: 'GO_BACK' });
    expect(actor.getSnapshot().value).toBe('welcome');

    // Forward through Calibrate to Sing
    actor.send({ type: 'START_PROGRAM' });
    actor.send({ type: 'MIC_GRANTED' });
    actor.send({
      type: 'CALIBRATION_DONE',
      result: { noiseGate: 0.01, noiseP95: 0.003, noiseMean: 0.002, tooNoisy: false, durationSeconds: 3 }
    });
    expect(actor.getSnapshot().value).toBe('sing');

    // Back from Sing to Calibrate
    actor.send({ type: 'GO_BACK' });
    expect(actor.getSnapshot().value).toBe('calibrate');

    // Back forward to Sing
    actor.send({
      type: 'CALIBRATION_DONE',
      result: { noiseGate: 0.01, noiseP95: 0.003, noiseMean: 0.002, tooNoisy: false, durationSeconds: 3 }
    });
    expect(actor.getSnapshot().value).toBe('sing');

    // Sing complete -> Scale Result
    actor.send({
      type: 'SINGING_COMPLETE',
      result: {
        tonic: 'D',
        mode: 'major',
        confidence: 0.92,
        runnerUp: { tonic: 'A', mode: 'major', confidence: 0.5 },
        lowConfidence: false,
        saFrequency: 293.66,
        chromaHistogram: new Float32Array(12)
      }
    });
    expect(actor.getSnapshot().value).toBe('scale_result');
    expect(actor.getSnapshot().context.selectedSaNote).toBe('D');
    expect(actor.getSnapshot().context.selectedSaHz).toBe(293.66);

    // Back from Scale Result to Sing
    actor.send({ type: 'GO_BACK' });
    expect(actor.getSnapshot().value).toBe('sing');

    // Sing complete again
    actor.send({
      type: 'SINGING_COMPLETE',
      result: {
        tonic: 'D',
        mode: 'major',
        confidence: 0.92,
        runnerUp: { tonic: 'A', mode: 'major', confidence: 0.5 },
        lowConfidence: false,
        saFrequency: 293.66,
        chromaHistogram: new Float32Array(12)
      }
    });
    expect(actor.getSnapshot().value).toBe('scale_result');

    // Confirm scale -> Menu
    actor.send({ type: 'CONFIRM_SCALE' });
    expect(actor.getSnapshot().value).toBe('menu');

    // Back from Menu to Scale Result (scaleResult is held!)
    actor.send({ type: 'GO_BACK' });
    expect(actor.getSnapshot().value).toBe('scale_result');
    expect(actor.getSnapshot().context.selectedSaNote).toBe('D');
    expect(actor.getSnapshot().context.scaleResult?.tonic).toBe('D');

    // Forward to Menu again
    actor.send({ type: 'CONFIRM_SCALE' });
    expect(actor.getSnapshot().value).toBe('menu');

    // Menu -> Select Condition (Hypertension) -> Listen
    actor.send({ type: 'SELECT_CONDITION', condition: 'hypertension' });
    expect(actor.getSnapshot().value).toBe('listen');
    expect(actor.getSnapshot().context.selectedCondition).toBe('hypertension');

    // User wants to go back to Menu to change condition
    actor.send({ type: 'GO_BACK' });
    expect(actor.getSnapshot().value).toBe('menu');
    // Note and condition are preserved!
    expect(actor.getSnapshot().context.selectedSaNote).toBe('D');
    expect(actor.getSnapshot().context.selectedCondition).toBe('hypertension');

    // Test CHANGE_CONDITION event from Listen
    actor.send({ type: 'SELECT_CONDITION', condition: 'diabetes' });
    expect(actor.getSnapshot().value).toBe('listen');
    actor.send({ type: 'CHANGE_CONDITION' });
    expect(actor.getSnapshot().value).toBe('menu');

    // Listen -> Chant Eval -> GO_BACK -> Listen
    actor.send({ type: 'SELECT_CONDITION', condition: 'diabetes' });
    actor.send({ type: 'START_CHANTING' });
    expect(actor.getSnapshot().value).toBe('chant_eval');

    actor.send({ type: 'GO_BACK' });
    expect(actor.getSnapshot().value).toBe('listen');
    expect(actor.getSnapshot().context.selectedCondition).toBe('diabetes');

    // Chant Hold -> GO_BACK -> Listen
    actor.send({ type: 'START_CHANTING' });
    actor.send({ type: 'EVAL_PASSED', finalAccuracy: 95 });
    expect(actor.getSnapshot().value).toBe('chant_hold');

    actor.send({ type: 'GO_BACK' });
    expect(actor.getSnapshot().value).toBe('listen');
  });

  it('preserves history origin when opening history from different screens', () => {
    const actor = createActor(appMachine).start();

    // From Welcome -> History -> Back returns to Welcome
    actor.send({ type: 'VIEW_HISTORY' });
    expect(actor.getSnapshot().value).toBe('history');
    actor.send({ type: 'GO_BACK' });
    expect(actor.getSnapshot().value).toBe('welcome');

    // Advance to Menu
    actor.send({ type: 'ACCEPT_DISCLAIMER' });
    actor.send({ type: 'START_PROGRAM' });
    actor.send({ type: 'MIC_GRANTED' });
    actor.send({
      type: 'CALIBRATION_DONE',
      result: { noiseGate: 0.01, noiseP95: 0.003, noiseMean: 0.002, tooNoisy: false, durationSeconds: 3 }
    });
    actor.send({
      type: 'SINGING_COMPLETE',
      result: {
        tonic: 'C',
        mode: 'major',
        confidence: 0.9,
        runnerUp: { tonic: 'G', mode: 'major', confidence: 0.4 },
        lowConfidence: false,
        saFrequency: 261.63,
        chromaHistogram: new Float32Array(12)
      }
    });
    actor.send({ type: 'CONFIRM_SCALE' });
    expect(actor.getSnapshot().value).toBe('menu');

    // From Menu -> History -> Back returns to Menu!
    actor.send({ type: 'VIEW_HISTORY' });
    expect(actor.getSnapshot().value).toBe('history');
    actor.send({ type: 'GO_BACK' });
    expect(actor.getSnapshot().value).toBe('menu');
  });
});

describe('Navigation Storage Persistence & Hydration', () => {
  class MockStorage implements Storage {
    private store: Record<string, string> = {};
    get length(): number {
      return Object.keys(this.store).length;
    }
    clear(): void {
      this.store = {};
    }
    getItem(key: string): string | null {
      return this.store[key] ?? null;
    }
    key(index: number): string | null {
      return Object.keys(this.store)[index] ?? null;
    }
    removeItem(key: string): void {
      delete this.store[key];
    }
    setItem(key: string, value: string): void {
      this.store[key] = String(value);
    }
  }

  beforeEach(() => {
    (globalThis as any).localStorage = new MockStorage();
    (globalThis as any).sessionStorage = new MockStorage();
  });

  it('persists and restores full context including Float32Array chromaHistogram', () => {
    const context = {
      ...INITIAL_CONTEXT,
      disclaimerAccepted: true,
      activeDay: 7,
      selectedSaNote: 'F#',
      selectedSaHz: 369.99,
      selectedCondition: 'thyroid' as const,
      scaleResult: {
        tonic: 'F#',
        mode: 'major' as const,
        confidence: 0.95,
        runnerUp: { tonic: 'C#', mode: 'major' as const, confidence: 0.5 },
        lowConfidence: false,
        saFrequency: 369.99,
        chromaHistogram: new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 0.5, 0.2])
      }
    };

    persistNavigationState('menu', context);

    const loaded = loadPersistedContext(INITIAL_CONTEXT);
    expect(loaded.disclaimerAccepted).toBe(true);
    expect(loaded.activeDay).toBe(7);
    expect(loaded.selectedSaNote).toBe('F#');
    expect(loaded.selectedSaHz).toBe(369.99);
    expect(loaded.selectedCondition).toBe('thyroid');
    expect(loaded.scaleResult).not.toBeNull();
    expect(loaded.scaleResult?.tonic).toBe('F#');
    expect(loaded.scaleResult?.chromaHistogram instanceof Float32Array).toBe(true);
    expect(loaded.scaleResult?.chromaHistogram.length).toBe(12);
  });

  it('restores persisted state using createAppMachine factory', () => {
    const context = {
      ...INITIAL_CONTEXT,
      disclaimerAccepted: true,
      selectedSaNote: 'A',
      selectedSaHz: 440.0,
      selectedCondition: 'diabetes' as const
    };

    const restoredMachine = createAppMachine(context, 'listen');
    const actor = createActor(restoredMachine).start();

    expect(actor.getSnapshot().value).toBe('listen');
    expect(actor.getSnapshot().context.selectedSaNote).toBe('A');
    expect(actor.getSnapshot().context.selectedCondition).toBe('diabetes');

    // Going back from restored state takes user to menu
    actor.send({ type: 'GO_BACK' });
    expect(actor.getSnapshot().value).toBe('menu');
  });
});
