/**
 * Application Configuration & Threshold Tuning — Compliant with TRD §6.5 & §7.3
 * Centralizes all DSP, evaluation, and session timing parameters.
 * Supports runtime tuning for Phase 3 beta testing.
 */

export interface AppConfig {
  /** Passing accuracy percentage required at evaluation gate (default: 90) */
  passThreshold: number;
  /** Required voiced chanting duration during initial evaluation in seconds (default: 7.5) */
  evalVoicedSeconds: number;
  /** Total hold duration for main daily chanting in minutes (default: 10) */
  holdMinutes: number;
  /** Minimum fraction of hold time required to be actively voiced (default: 0.5 -> 300s) */
  minVoicedShare: number;
  /** Minimum voiced frames required during free singing capture in seconds (default: 3.0) */
  minSingVoicedSeconds: number;
  /** Maximum duration of free song capture in seconds (default: 15.0) */
  singMaxDurationSeconds: number;
  /** Target duration for alternative sa_hold single-note hold in seconds (default: 4.0) */
  saHoldDurationSeconds: number;
  /** Maximum pitch spread in cents to consider sa_hold stable (default: 25.0) */
  saHoldMaxSpreadCents: number;
  /** Musical tuning system (default: 'just') */
  tuning: 'just' | 'equal';
}

export const DEFAULT_CONFIG: AppConfig = {
  passThreshold: 90,
  evalVoicedSeconds: 7.5,
  holdMinutes: 10,
  minVoicedShare: 0.5,
  minSingVoicedSeconds: 3.0,
  singMaxDurationSeconds: 15.0,
  saHoldDurationSeconds: 4.0,
  saHoldMaxSpreadCents: 25.0,
  tuning: 'just',
};

class ConfigManager {
  private config: AppConfig = { ...DEFAULT_CONFIG };

  getConfig(): AppConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<AppConfig>): AppConfig {
    this.config = { ...this.config, ...updates };
    return this.getConfig();
  }

  resetDefaults(): AppConfig {
    this.config = { ...DEFAULT_CONFIG };
    return this.getConfig();
  }
}

export const appConfig = new ConfigManager();
