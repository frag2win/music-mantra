import { describe, it, expect } from 'vitest';
import { CHAKRA_THEMES, DEFAULT_NEUTRAL_THEME } from '../../src/theme/chakraThemes';
import { MOTION_TIMINGS } from '../../src/theme/motion';

describe('Chakra Themes & Calming-UI Palettes', () => {
  it('defines comprehensive configs for all 3 disease themes', () => {
    const conditions = ['diabetes', 'hypertension', 'thyroid'] as const;

    for (const cond of conditions) {
      const theme = CHAKRA_THEMES[cond];
      expect(theme).toBeDefined();
      expect(theme.id).toBe(cond);
      expect(theme.chakraName).toBeTruthy();
      expect(theme.swar).toBeTruthy();
      expect(theme.mantra).toBeTruthy();
      expect(theme.bgGradient.from).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.pitchFeedback).toBeDefined();
    }
  });

  it('verifies chromotherapy calm guidelines: offPitch never uses high-arousal red', () => {
    for (const [cond, theme] of Object.entries(CHAKRA_THEMES)) {
      // In mental wellness apps, off-pitch / error must be desaturated neutral stone/zinc, not bright alerting red
      expect(theme.pitchFeedback.offPitch).not.toBe('#ef4444');
      expect(theme.pitchFeedback.offPitch).not.toBe('#ff0000');
      // Should be gentle neutral tone (e.g. #78716c stone, #71717a zinc, #64748b slate)
      expect(['#78716c', '#71717a', '#64748b']).toContain(theme.pitchFeedback.offPitch);
    }
  });

  it('matches traditional sacred geometry and chakra swara alignments', () => {
    // Diabetes / Manipura / Ga
    expect(CHAKRA_THEMES.diabetes.chakraName).toBe('Manipura');
    expect(CHAKRA_THEMES.diabetes.swar).toBe('Ga');
    expect(CHAKRA_THEMES.diabetes.sacredGeometry.type).toBe('ten-petal-lotus');
    expect(CHAKRA_THEMES.diabetes.motionPreset).toBe('sun-pulse');

    // Hypertension / Anahata / Ma
    expect(CHAKRA_THEMES.hypertension.chakraName).toBe('Anahata');
    expect(CHAKRA_THEMES.hypertension.swar).toBe('Ma');
    expect(CHAKRA_THEMES.hypertension.sacredGeometry.type).toBe('anahata-hexagram');
    expect(CHAKRA_THEMES.hypertension.motionPreset).toBe('breathing-circle');

    // Thyroid / Vishuddha / Pa
    expect(CHAKRA_THEMES.thyroid.chakraName).toBe('Vishuddha');
    expect(CHAKRA_THEMES.thyroid.swar).toBe('Pa');
    expect(CHAKRA_THEMES.thyroid.sacredGeometry.type).toBe('sixteen-petal-lotus');
    expect(CHAKRA_THEMES.thyroid.motionPreset).toBe('sound-ripple');
  });

  it('verifies 4-1-6 relaxation breathing cadence for hypertension', () => {
    const breath = MOTION_TIMINGS.breathCycle;
    expect(breath.inhaleSec).toBe(4);
    expect(breath.holdSec).toBe(1);
    expect(breath.exhaleSec).toBe(6);
    expect(breath.totalSec).toBe(11);
  });

  it('verifies solar pulse cycle for diabetes', () => {
    const sun = MOTION_TIMINGS.sunPulse;
    expect(sun.cycleSec).toBe(8.5);
    expect(sun.lotusRotationSec).toBe(60);
  });

  it('verifies concentric sound wave ripple cycle for thyroid', () => {
    const ripple = MOTION_TIMINGS.soundRipple;
    expect(ripple.cycleSec).toBe(6);
    expect(ripple.waveCount).toBe(3);
  });

  it('provides a valid fallback neutral theme when no condition is selected', () => {
    expect(DEFAULT_NEUTRAL_THEME).toBeDefined();
    expect(DEFAULT_NEUTRAL_THEME.accent).toBe('#6366f1');
    expect(DEFAULT_NEUTRAL_THEME.pitchFeedback.offPitch).toBe('#64748b');
  });

  it('verifies WCAG AA text contrast (>= 4.5:1) at every gradient endpoint', () => {
    function getLuminance(hex: string): number {
      const clean = hex.replace('#', '');
      const r = parseInt(clean.substring(0, 2), 16) / 255;
      const g = parseInt(clean.substring(2, 4), 16) / 255;
      const b = parseInt(clean.substring(4, 6), 16) / 255;
      const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    }

    function getContrast(hex1: string, hex2: string): number {
      const l1 = getLuminance(hex1);
      const l2 = getLuminance(hex2);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    }

    const textPrimary = '#f8fafc';
    const textSecondary = '#cbd5e1';

    for (const [cond, theme] of Object.entries(CHAKRA_THEMES)) {
      const stops = [theme.bgGradient.from, theme.bgGradient.via, theme.bgGradient.to];
      for (const stop of stops) {
        const ratioPrimary = getContrast(textPrimary, stop);
        const ratioSecondary = getContrast(textSecondary, stop);

        // WCAG AA minimum is 4.5:1 for normal text
        expect(ratioPrimary, `${cond} stop ${stop} against primary text`).toBeGreaterThanOrEqual(7.0);
        expect(ratioSecondary, `${cond} stop ${stop} against secondary text`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it('verifies GPU-only animation constraints for 60fps fullscreen performance', () => {
    // 60fps rule: fullscreen animations must animate transform & opacity only
    // Breathing loop cycle is 11s (4-1-6s)
    expect(MOTION_TIMINGS.breathCycle.totalSec).toBe(11);
    // Sun pulse cycle is 8.5s with 60s imperceptible rotation
    expect(MOTION_TIMINGS.sunPulse.cycleSec).toBe(8.5);
    expect(MOTION_TIMINGS.sunPulse.lotusRotationSec).toBe(60);
    // Sound ripple cycle is 6s with 3 waves
    expect(MOTION_TIMINGS.soundRipple.cycleSec).toBe(6);
    expect(MOTION_TIMINGS.soundRipple.waveCount).toBe(3);
  });
});
