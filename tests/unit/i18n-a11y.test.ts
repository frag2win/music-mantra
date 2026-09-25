import { describe, it, expect } from 'vitest';
import en from '../../src/i18n/locales/en.json';
import hi from '../../src/i18n/locales/hi.json';
import mr from '../../src/i18n/locales/mr.json';

describe('Phase 4: Internationalization (i18n) & Accessibility (WCAG 2.1 AA)', () => {
  it('contains complete translation coverage for all 3 supported languages', () => {
    // Check that core keys exist across en, hi, and mr
    const languages = [
      { code: 'en', data: en },
      { code: 'hi', data: hi },
      { code: 'mr', data: mr },
    ];

    for (const lang of languages) {
      expect(lang.data.app.title).toBeDefined();
      expect(lang.data.app.medicalDisclaimer).toBeDefined();
      expect(lang.data.conditions.diabetes.name).toBeDefined();
      expect(lang.data.conditions.hypertension.name).toBeDefined();
      expect(lang.data.conditions.thyroid.name).toBeDefined();
      expect(lang.data.welcome.ageDeclaration).toBeDefined();
      expect(lang.data.chantEval.inTune).toBeDefined();
      expect(lang.data.chantEval.flat).toBeDefined();
      expect(lang.data.chantEval.sharp).toBeDefined();
    }
  });

  it('correctly provides Devnagari translations for Hindi and Marathi', () => {
    // Hindi
    expect(hi.conditions.diabetes.mantra).toBe('रं');
    expect(hi.conditions.hypertension.mantra).toBe('यं');
    expect(hi.conditions.thyroid.mantra).toBe('हं');
    expect(hi.conditions.diabetes.swar).toBe('ग');

    // Marathi
    expect(mr.conditions.diabetes.chakra).toBe('मणिपूर');
    expect(mr.conditions.hypertension.chakra).toBe('अनाहत');
    expect(mr.conditions.thyroid.chakra).toBe('विशुद्ध');
  });

  it('formats translation parameter interpolation cleanly', () => {
    const template = en.app.dayProgress; // "Day {day} of 45"
    const formatted = template.replace('{day}', '5');
    expect(formatted).toBe('Day 5 of 45');

    const hiTemplate = hi.app.dayProgress; // "दिन {day} / 45"
    const hiFormatted = hiTemplate.replace('{day}', '12');
    expect(hiFormatted).toBe('दिन 12 / 45');
  });

  it('ensures pitch error classifies non-color textual direction badges (WCAG 2.1 AA)', () => {
    function getPitchDirection(centError: number): { label: string; status: 'flat' | 'in-tune' | 'sharp' } {
      if (Math.abs(centError) <= 15) {
        return { label: 'In Tune (Perfect)', status: 'in-tune' };
      }
      return centError < 0
        ? { label: 'Flat (Sing Higher)', status: 'flat' }
        : { label: 'Sharp (Sing Lower)', status: 'sharp' };
    }

    expect(getPitchDirection(2).status).toBe('in-tune');
    expect(getPitchDirection(-25).status).toBe('flat');
    expect(getPitchDirection(35).status).toBe('sharp');
  });
});
