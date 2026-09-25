import type { AppMachineContext } from '../machine/app-machine';

const STORAGE_KEY_STATE = 'swara_nav_state';
const STORAGE_KEY_CONTEXT = 'swara_nav_context';
const STORAGE_KEY_PERMANENT = 'swara_permanent_user';

export interface PersistentUserData {
  disclaimerAccepted: boolean;
  activeDay: number;
  totalProgramDays: number;
  selectedSaNote: string | null;
  selectedSaHz: number | null;
  selectedCondition: any;
  sessionHistory: any[];
}

function getSessionStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage;
    }
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage;
    }
  } catch {
    // Storage access blocked or restricted
  }
  return null;
}

function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    // Storage access blocked or restricted
  }
  return null;
}

/**
 * Safely serialize ScaleDetectionResult (re-packing Float32Array if needed)
 */
function serializeContext(context: AppMachineContext): string {
  const serializable = {
    ...context,
    scaleResult: context.scaleResult
      ? {
          ...context.scaleResult,
          chromaHistogram: Array.from(context.scaleResult.chromaHistogram)
        }
      : null
  };
  return JSON.stringify(serializable);
}

/**
 * Safely deserialize ScaleDetectionResult (reconstructing Float32Array)
 */
function deserializeContext(jsonStr: string): Partial<AppMachineContext> | null {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || typeof data !== 'object') return null;

    if (data.scaleResult && Array.isArray(data.scaleResult.chromaHistogram)) {
      data.scaleResult.chromaHistogram = new Float32Array(data.scaleResult.chromaHistogram);
    }
    return data;
  } catch (err) {
    console.warn('[NavigationStorage] Failed to deserialize context:', err);
    return null;
  }
}

/**
 * Save current machine state and full context to sessionStorage and localStorage.
 */
export function persistNavigationState(state: string, context: AppMachineContext): void {
  try {
    const session = getSessionStorage();
    if (session) {
      session.setItem(STORAGE_KEY_STATE, state);
      session.setItem(STORAGE_KEY_CONTEXT, serializeContext(context));
    }

    const local = getLocalStorage();
    if (local) {
      const permanentData: PersistentUserData = {
        disclaimerAccepted: context.disclaimerAccepted,
        activeDay: context.activeDay,
        totalProgramDays: context.totalProgramDays,
        selectedSaNote: context.selectedSaNote,
        selectedSaHz: context.selectedSaHz,
        selectedCondition: context.selectedCondition,
        sessionHistory: context.sessionHistory
      };
      local.setItem(STORAGE_KEY_PERMANENT, JSON.stringify(permanentData));
    }
  } catch (err) {
    console.warn('[NavigationStorage] Failed to persist state:', err);
  }
}

/**
 * Load saved context combining long-term localStorage and session navigation state.
 */
export function loadPersistedContext(fallback: AppMachineContext): AppMachineContext {
  try {
    let result = { ...fallback };

    // 1. Recover long-term progress from localStorage
    const local = getLocalStorage();
    if (local) {
      const savedPermanent = local.getItem(STORAGE_KEY_PERMANENT);
      if (savedPermanent) {
        try {
          const parsed = JSON.parse(savedPermanent);
          if (parsed.disclaimerAccepted !== undefined) result.disclaimerAccepted = parsed.disclaimerAccepted;
          if (parsed.activeDay !== undefined) result.activeDay = parsed.activeDay;
          if (parsed.totalProgramDays !== undefined) result.totalProgramDays = parsed.totalProgramDays;
          if (parsed.selectedSaNote) result.selectedSaNote = parsed.selectedSaNote;
          if (parsed.selectedSaHz) result.selectedSaHz = parsed.selectedSaHz;
          if (parsed.selectedCondition) result.selectedCondition = parsed.selectedCondition;
          if (Array.isArray(parsed.sessionHistory)) result.sessionHistory = parsed.sessionHistory;
        } catch (e) {
          console.warn('[NavigationStorage] Error reading permanent data:', e);
        }
      }
    }

    // 2. Recover active session data from sessionStorage
    const session = getSessionStorage();
    if (session) {
      const savedSession = session.getItem(STORAGE_KEY_CONTEXT);
      if (savedSession) {
        const parsedSession = deserializeContext(savedSession);
        if (parsedSession) {
          result = {
            ...result,
            ...parsedSession,
            // Keep persistent properties if session didn't have them
            activeDay: parsedSession.activeDay ?? result.activeDay,
            totalProgramDays: parsedSession.totalProgramDays ?? result.totalProgramDays,
            sessionHistory: parsedSession.sessionHistory ?? result.sessionHistory
          };
        }
      }
    }

    return result;
  } catch (err) {
    console.warn('[NavigationStorage] Error loading context:', err);
    return fallback;
  }
}

/**
 * Load saved state name from session storage or URL hash.
 */
export function loadPersistedState(): string | null {
  try {
    const VALID_RESTORABLE_STATES = [
      'welcome',
      'calibrate',
      'sing',
      'scale_result',
      'menu',
      'listen',
      'history',
      'session_done'
    ];

    // 1. Check URL hash (e.g. #menu, #listen)
    if (typeof window !== 'undefined' && window.location?.hash) {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash && VALID_RESTORABLE_STATES.includes(hash)) {
        return hash;
      }
    }

    // 2. Check sessionStorage
    const session = getSessionStorage();
    if (session) {
      const saved = session.getItem(STORAGE_KEY_STATE);
      if (saved && VALID_RESTORABLE_STATES.includes(saved)) {
        return saved;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Clears temporary navigation state.
 */
export function clearNavigationState(): void {
  try {
    const session = getSessionStorage();
    if (session) {
      session.removeItem(STORAGE_KEY_STATE);
      session.removeItem(STORAGE_KEY_CONTEXT);
    }
  } catch (err) {
    console.warn('[NavigationStorage] Error clearing state:', err);
  }
}
