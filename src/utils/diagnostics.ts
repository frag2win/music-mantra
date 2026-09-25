/**
 * Client Hardware & Audio Capabilities Diagnostics Tool
 * Compliant with BUILDING-PLAN §3.2 Device Testing Matrix
 */

export interface DeviceDiagnostics {
  timestamp: string;
  userAgent: string;
  platform: string;
  browser: 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Other';
  os: 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux' | 'Other';
  screenResolution: string;
  touchSupport: boolean;
  audioWorkletSupported: boolean;
  wakeLockSupported: boolean;
  sampleRate?: number;
  maxChannelCount?: number;
  isNarrowband?: boolean;
}

export function detectBrowser(ua: string): 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Other' {
  if (/Edg/i.test(ua)) return 'Edge';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Chrome|CriOS/i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  return 'Other';
}

export function detectOS(ua: string): 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux' | 'Other' {
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Win/i.test(ua)) return 'Windows';
  if (/Mac/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Other';
}

export async function collectDeviceDiagnostics(): Promise<DeviceDiagnostics> {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'Node/Test';
  const platform = typeof navigator !== 'undefined' ? (navigator as any).userAgentData?.platform || navigator.platform || 'Unknown' : 'Server';

  let sampleRate: number | undefined;
  let maxChannelCount: number | undefined;

  if (typeof window !== 'undefined' && 'AudioContext' in window) {
    try {
      const ctx = new AudioContext();
      sampleRate = ctx.sampleRate;
      maxChannelCount = ctx.destination.maxChannelCount;
      ctx.close().catch(() => {});
    } catch {
      // AudioContext unavailable
    }
  }

  return {
    timestamp: new Date().toISOString(),
    userAgent: ua,
    platform,
    browser: detectBrowser(ua),
    os: detectOS(ua),
    screenResolution: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : '0x0',
    touchSupport: typeof navigator !== 'undefined' ? navigator.maxTouchPoints > 0 : false,
    audioWorkletSupported: typeof window !== 'undefined' && 'AudioWorkletNode' in window,
    wakeLockSupported: typeof navigator !== 'undefined' && 'wakeLock' in navigator,
    sampleRate,
    maxChannelCount,
    isNarrowband: sampleRate !== undefined && sampleRate < 16000,
  };
}
