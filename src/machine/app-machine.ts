import { setup, assign } from 'xstate';
import type { HealthCondition, SessionRecord } from '../types';
import type { CalibrationResult } from '../audio/calibration';
import type { ScaleDetectionResult } from '../audio/scale-detector';

export interface AppMachineContext {
  disclaimerAccepted: boolean;
  activeDay: number;
  totalProgramDays: number;
  calibration: CalibrationResult | null;
  scaleResult: ScaleDetectionResult | null;
  selectedSaNote: string | null;
  selectedSaHz: number | null;
  saHoldEnabled: boolean;
  selectedCondition: HealthCondition | null;
  currentAccuracy: number;
  evalAccuracy: number;
  voicedSeconds: number;
  holdTimeRemainingSeconds: number;
  sessionHistory: SessionRecord[];
  pausedFromState?: string;
  errorMessage?: string;
}

export type AppMachineEvent =
  | { type: 'ACCEPT_DISCLAIMER' }
  | { type: 'START_PROGRAM' }
  | { type: 'MIC_GRANTED' }
  | { type: 'MIC_DENIED'; message?: string }
  | { type: 'RETRY_PERMISSIONS' }
  | { type: 'CALIBRATION_DONE'; result: CalibrationResult }
  | { type: 'CALIBRATION_FAILED'; message?: string }
  | { type: 'RETRY_CALIBRATION' }
  | { type: 'SINGING_COMPLETE'; result: ScaleDetectionResult }
  | { type: 'RETRY_SINGING' }
  | { type: 'OVERRIDE_SA'; saNote: string; saHz: number }
  | { type: 'TOGGLE_SA_HOLD' }
  | { type: 'CONFIRM_SCALE' }
  | { type: 'SELECT_CONDITION'; condition: HealthCondition }
  | { type: 'START_CHANTING' }
  | { type: 'EVAL_UPDATE'; currentAccuracy: number; evalAccuracy: number; voicedSeconds: number }
  | { type: 'EVAL_PASSED'; finalAccuracy: number }
  | { type: 'EVAL_FAILED'; finalAccuracy: number }
  | { type: 'ACKNOWLEDGE_RETRY' }
  | { type: 'HOLD_TICK'; currentAccuracy: number; voicedSeconds: number; remainingSeconds: number }
  | { type: 'HOLD_PASSED'; session: SessionRecord }
  | { type: 'HOLD_FAILED' }
  | { type: 'GO_HOME' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'DISCARD' }
  | { type: 'VIEW_HISTORY' }
  | { type: 'BACK_TO_APP' };

export const INITIAL_CONTEXT: AppMachineContext = {
  disclaimerAccepted: false,
  activeDay: 1,
  totalProgramDays: 45,
  calibration: null,
  scaleResult: null,
  selectedSaNote: null,
  selectedSaHz: null,
  saHoldEnabled: false,
  selectedCondition: null,
  currentAccuracy: 0,
  evalAccuracy: 0,
  voicedSeconds: 0,
  holdTimeRemainingSeconds: 600, // 10 minutes
  sessionHistory: [],
  errorMessage: undefined
};

export const appMachine = setup({
  types: {
    context: {} as AppMachineContext,
    events: {} as AppMachineEvent
  },
  actions: {
    setDisclaimerAccepted: assign({
      disclaimerAccepted: true
    }),
    setMicDenied: assign({
      errorMessage: ({ event }) => (event.type === 'MIC_DENIED' ? event.message || 'Microphone access denied' : undefined)
    }),
    setCalibration: assign({
      calibration: ({ event }) => (event.type === 'CALIBRATION_DONE' ? event.result : null)
    }),
    setScaleResult: assign({
      scaleResult: ({ event }) => (event.type === 'SINGING_COMPLETE' ? event.result : null),
      selectedSaNote: ({ event }) => (event.type === 'SINGING_COMPLETE' ? event.result.tonic : null),
      selectedSaHz: ({ event }) => (event.type === 'SINGING_COMPLETE' ? event.result.saFrequency : null)
    }),
    overrideSa: assign({
      selectedSaNote: ({ event }) => (event.type === 'OVERRIDE_SA' ? event.saNote : null),
      selectedSaHz: ({ event }) => (event.type === 'OVERRIDE_SA' ? event.saHz : null)
    }),
    toggleSaHold: assign({
      saHoldEnabled: ({ context }) => !context.saHoldEnabled
    }),
    setCondition: assign({
      selectedCondition: ({ event }) => (event.type === 'SELECT_CONDITION' ? event.condition : null)
    }),
    updateEval: assign({
      currentAccuracy: ({ event }) => (event.type === 'EVAL_UPDATE' ? event.currentAccuracy : 0),
      evalAccuracy: ({ event }) => (event.type === 'EVAL_UPDATE' ? event.evalAccuracy : 0),
      voicedSeconds: ({ event }) => (event.type === 'EVAL_UPDATE' ? event.voicedSeconds : 0)
    }),
    updateHoldTick: assign({
      currentAccuracy: ({ event }) => (event.type === 'HOLD_TICK' ? event.currentAccuracy : 0),
      voicedSeconds: ({ event }) => (event.type === 'HOLD_TICK' ? event.voicedSeconds : 0),
      holdTimeRemainingSeconds: ({ event }) => (event.type === 'HOLD_TICK' ? event.remainingSeconds : 0)
    }),
    saveSession: assign({
      sessionHistory: ({ context, event }) => {
        if (event.type === 'HOLD_PASSED') {
          return [event.session, ...context.sessionHistory];
        }
        return context.sessionHistory;
      },
      activeDay: ({ context, event }) => {
        if (event.type === 'HOLD_PASSED') {
          return Math.min(context.totalProgramDays, context.activeDay + 1);
        }
        return context.activeDay;
      }
    }),
    resetSessionCounters: assign({
      currentAccuracy: 0,
      evalAccuracy: 0,
      voicedSeconds: 0,
      holdTimeRemainingSeconds: 600
    })
  }
}).createMachine({
  id: 'swaraApp',
  initial: 'welcome',
  context: INITIAL_CONTEXT,
  states: {
    welcome: {
      on: {
        ACCEPT_DISCLAIMER: {
          actions: 'setDisclaimerAccepted'
        },
        START_PROGRAM: {
          guard: ({ context }) => context.disclaimerAccepted,
          target: 'mic_permission'
        },
        VIEW_HISTORY: {
          target: 'history'
        }
      }
    },

    mic_permission: {
      on: {
        MIC_GRANTED: {
          target: 'calibrate'
        },
        MIC_DENIED: {
          actions: 'setMicDenied',
          target: 'error_mic'
        }
      }
    },

    error_mic: {
      on: {
        RETRY_PERMISSIONS: {
          target: 'mic_permission'
        },
        GO_HOME: {
          target: 'welcome'
        }
      }
    },

    calibrate: {
      on: {
        CALIBRATION_DONE: {
          actions: 'setCalibration',
          target: 'sing'
        },
        CALIBRATION_FAILED: {
          target: 'error_calibration'
        }
      }
    },

    error_calibration: {
      on: {
        RETRY_CALIBRATION: {
          target: 'calibrate'
        },
        GO_HOME: {
          target: 'welcome'
        }
      }
    },

    sing: {
      entry: 'resetSessionCounters',
      on: {
        SINGING_COMPLETE: {
          actions: 'setScaleResult',
          target: 'scale_result'
        },
        RETRY_SINGING: {
          target: 'sing'
        }
      }
    },

    scale_result: {
      on: {
        OVERRIDE_SA: {
          actions: 'overrideSa'
        },
        TOGGLE_SA_HOLD: {
          actions: 'toggleSaHold'
        },
        CONFIRM_SCALE: {
          target: 'menu'
        },
        RETRY_SINGING: {
          target: 'sing'
        }
      }
    },

    menu: {
      on: {
        SELECT_CONDITION: {
          actions: 'setCondition',
          target: 'listen'
        },
        RETRY_SINGING: {
          target: 'sing'
        }
      }
    },

    listen: {
      entry: 'resetSessionCounters',
      on: {
        START_CHANTING: {
          target: 'chant_eval'
        },
        SELECT_CONDITION: {
          actions: 'setCondition',
          target: 'listen'
        },
        GO_HOME: {
          target: 'welcome'
        }
      }
    },

    chant_eval: {
      on: {
        EVAL_UPDATE: {
          actions: 'updateEval'
        },
        EVAL_PASSED: {
          target: 'chant_hold'
        },
        EVAL_FAILED: {
          target: 'retry'
        },
        PAUSE: {
          target: 'paused'
        }
      }
    },

    retry: {
      on: {
        ACKNOWLEDGE_RETRY: {
          target: 'listen'
        }
      }
    },

    chant_hold: {
      on: {
        HOLD_TICK: {
          actions: 'updateHoldTick'
        },
        HOLD_PASSED: {
          actions: 'saveSession',
          target: 'session_done'
        },
        HOLD_FAILED: {
          target: 'retry_short'
        },
        PAUSE: {
          target: 'paused'
        }
      }
    },

    retry_short: {
      on: {
        ACKNOWLEDGE_RETRY: {
          target: 'listen'
        }
      }
    },

    session_done: {
      on: {
        GO_HOME: {
          target: 'welcome'
        },
        VIEW_HISTORY: {
          target: 'history'
        }
      }
    },

    history: {
      on: {
        BACK_TO_APP: {
          target: 'welcome'
        }
      }
    },

    paused: {
      on: {
        RESUME: {
          target: 'chant_eval'
        },
        DISCARD: {
          target: 'welcome'
        }
      }
    }
  }
});
