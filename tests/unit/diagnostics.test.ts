import { describe, it, expect } from 'vitest';
import { detectBrowser, detectOS, collectDeviceDiagnostics } from '../../src/utils/diagnostics';

describe('Phase 3: Device Diagnostics & Capability Audit', () => {
  it('correctly identifies browsers from User Agent strings', () => {
    expect(detectBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')).toBe('Chrome');
    expect(detectBrowser('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15')).toBe('Safari');
    expect(detectBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0')).toBe('Firefox');
    expect(detectBrowser('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0')).toBe('Edge');
  });

  it('correctly identifies operating systems from User Agent strings', () => {
    expect(detectOS('Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X)')).toBe('iOS');
    expect(detectOS('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe('Android');
    expect(detectOS('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe('Windows');
    expect(detectOS('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe('macOS');
  });

  it('collects diagnostic structure safely in node environment', async () => {
    const diag = await collectDeviceDiagnostics();
    expect(diag).toBeDefined();
    expect(diag.timestamp).toBeDefined();
    expect(typeof diag.audioWorkletSupported).toBe('boolean');
    expect(typeof diag.wakeLockSupported).toBe('boolean');
  });
});
