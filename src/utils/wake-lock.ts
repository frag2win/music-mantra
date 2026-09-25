/**
 * Screen Wake Lock Manager — Compliant with TRD §10
 * Keeps display awake during LISTEN, CHANT_EVAL, and CHANT_HOLD.
 * Automatically re-acquires lock when tab regains visibility.
 */

export class ScreenWakeLockManager {
  private sentinel: any = null;
  private isActive = false;
  private onVisibilityChangeBound: () => void;

  constructor() {
    this.onVisibilityChangeBound = this.handleVisibilityChange.bind(this);
  }

  async acquire(): Promise<boolean> {
    this.isActive = true;

    if (!('wakeLock' in navigator)) {
      console.warn('[WakeLock] Screen Wake Lock API not supported in this browser.');
      return false;
    }

    try {
      this.sentinel = await (navigator as any).wakeLock.request('screen');
      document.addEventListener('visibilitychange', this.onVisibilityChangeBound);
      return true;
    } catch (err) {
      console.warn('[WakeLock] Failed to acquire screen wake lock:', err);
      return false;
    }
  }

  async release(): Promise<void> {
    this.isActive = false;
    document.removeEventListener('visibilitychange', this.onVisibilityChangeBound);

    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch {
        // Already released
      }
      this.sentinel = null;
    }
  }

  private async handleVisibilityChange() {
    if (this.isActive && document.visibilityState === 'visible') {
      try {
        if ('wakeLock' in navigator) {
          this.sentinel = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('[WakeLock] Could not re-acquire wake lock on visibility change:', err);
      }
    }
  }
}

export const wakeLockManager = new ScreenWakeLockManager();
