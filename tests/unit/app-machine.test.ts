import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { appMachine } from '../../src/machine/app-machine';

describe('App State Machine', () => {
  it('starts in welcome state', () => {
    const actor = createActor(appMachine).start();
    expect(actor.getSnapshot().value).toBe('welcome');
    expect(actor.getSnapshot().context.disclaimerAccepted).toBe(false);
  });

  it('requires disclaimer acceptance before starting program', () => {
    const actor = createActor(appMachine).start();
    actor.send({ type: 'START_PROGRAM' });
    // Guard fails, stays in welcome
    expect(actor.getSnapshot().value).toBe('welcome');

    actor.send({ type: 'ACCEPT_DISCLAIMER' });
    expect(actor.getSnapshot().context.disclaimerAccepted).toBe(true);

    actor.send({ type: 'START_PROGRAM' });
    expect(actor.getSnapshot().value).toBe('mic_permission');
  });

  it('handles mic permission flow (granted and denied)', () => {
    const actorGranted = createActor(appMachine).start();
    actorGranted.send({ type: 'ACCEPT_DISCLAIMER' });
    actorGranted.send({ type: 'START_PROGRAM' });
    actorGranted.send({ type: 'MIC_GRANTED' });
    expect(actorGranted.getSnapshot().value).toBe('calibrate');

    const actorDenied = createActor(appMachine).start();
    actorDenied.send({ type: 'ACCEPT_DISCLAIMER' });
    actorDenied.send({ type: 'START_PROGRAM' });
    actorDenied.send({ type: 'MIC_DENIED', message: 'No mic found' });
    expect(actorDenied.getSnapshot().value).toBe('error_mic');
    expect(actorDenied.getSnapshot().context.errorMessage).toBe('No mic found');
  });

  it('transitions calibration -> sing -> scale_result -> menu -> listen', () => {
    const actor = createActor(appMachine).start();
    actor.send({ type: 'ACCEPT_DISCLAIMER' });
    actor.send({ type: 'START_PROGRAM' });
    actor.send({ type: 'MIC_GRANTED' });

    actor.send({
      type: 'CALIBRATION_DONE',
      result: { noiseGate: 0.01, noiseP95: 0.003, noiseMean: 0.002, tooNoisy: false, durationSeconds: 3 }
    });
    expect(actor.getSnapshot().value).toBe('sing');

    actor.send({
      type: 'SINGING_COMPLETE',
      result: {
        tonic: 'C',
        mode: 'major',
        confidence: 0.85,
        runnerUp: { tonic: 'G', mode: 'major', confidence: 0.5 },
        lowConfidence: false,
        saFrequency: 261.63,
        chromaHistogram: new Float32Array(12)
      }
    });
    expect(actor.getSnapshot().value).toBe('scale_result');
    expect(actor.getSnapshot().context.selectedSaNote).toBe('C');

    // Override Sa
    actor.send({ type: 'OVERRIDE_SA', saNote: 'D', saHz: 293.66 });
    expect(actor.getSnapshot().context.selectedSaNote).toBe('D');

    actor.send({ type: 'CONFIRM_SCALE' });
    expect(actor.getSnapshot().value).toBe('menu');

    actor.send({ type: 'SELECT_CONDITION', condition: 'diabetes' });
    expect(actor.getSnapshot().value).toBe('listen');
    expect(actor.getSnapshot().context.selectedCondition).toBe('diabetes');
  });

  it('handles chant evaluation, hold, and session completion', () => {
    const actor = createActor(appMachine).start();
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
        confidence: 0.85,
        runnerUp: { tonic: 'G', mode: 'major', confidence: 0.5 },
        lowConfidence: false,
        saFrequency: 261.63,
        chromaHistogram: new Float32Array(12)
      }
    });
    actor.send({ type: 'CONFIRM_SCALE' });
    actor.send({ type: 'SELECT_CONDITION', condition: 'thyroid' });

    actor.send({ type: 'START_CHANTING' });
    expect(actor.getSnapshot().value).toBe('chant_eval');

    actor.send({ type: 'EVAL_PASSED', finalAccuracy: 94 });
    expect(actor.getSnapshot().value).toBe('chant_hold');

    const mockSession = {
      id: 'sess-123',
      dayIndex: 1,
      date: new Date().toISOString(),
      condition: 'thyroid' as const,
      saNote: 'C',
      saHz: 261.63,
      evalAccuracy: 94,
      meanAccuracy: 92,
      voicedSeconds: 450,
      totalDurationSeconds: 600,
      completed: true
    };

    actor.send({ type: 'HOLD_PASSED', session: mockSession });
    expect(actor.getSnapshot().value).toBe('session_done');
    expect(actor.getSnapshot().context.sessionHistory.length).toBe(1);
    expect(actor.getSnapshot().context.activeDay).toBe(2);
  });

  it('handles eval failure -> retry -> listen path', () => {
    const actor = createActor(appMachine).start();
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
        confidence: 0.85,
        runnerUp: { tonic: 'G', mode: 'major', confidence: 0.5 },
        lowConfidence: false,
        saFrequency: 261.63,
        chromaHistogram: new Float32Array(12)
      }
    });
    actor.send({ type: 'CONFIRM_SCALE' });
    actor.send({ type: 'SELECT_CONDITION', condition: 'hypertension' });
    actor.send({ type: 'START_CHANTING' });

    actor.send({ type: 'EVAL_FAILED', finalAccuracy: 65 });
    expect(actor.getSnapshot().value).toBe('retry');

    actor.send({ type: 'ACKNOWLEDGE_RETRY' });
    expect(actor.getSnapshot().value).toBe('listen');
  });
});
