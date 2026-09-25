import React, { createContext, useContext, useState, useEffect } from 'react';
import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';
import { GlobeIcon } from '../components/common/Icons';

export type Locale = 'en' | 'hi' | 'mr';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const LOCALES: Record<Locale, any> = { en, hi, mr };
const STORAGE_KEY = 'music_mantra_locale';

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale;
    return saved && LOCALES[saved] ? saved : 'en';
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    document.documentElement.lang = newLocale;
  };

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = (path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let val: any = LOCALES[locale];

    for (const k of keys) {
      if (val && typeof val === 'object' && k in val) {
        val = val[k];
      } else {
        // Fallback to English
        let fallbackVal: any = LOCALES.en;
        for (const fb of keys) {
          if (fallbackVal && typeof fallbackVal === 'object' && fb in fallbackVal) {
            fallbackVal = fallbackVal[fb];
          } else {
            fallbackVal = path;
            break;
          }
        }
        val = fallbackVal;
        break;
      }
    }

    let text = typeof val === 'string' ? val : path;

    if (params) {
      for (const [pk, pv] of Object.entries(params)) {
        text = text.replace(new RegExp(`\\{${pk}\\}`, 'g'), String(pv));
      }
    }

    return text;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextType => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
};

/**
 * Dropdown / Toggle component for selecting app language
 */
export const LanguageSwitcher: React.FC<{ className?: string }> = ({ className }) => {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        background: 'rgba(30, 41, 59, 0.7)',
        padding: '0.25rem 0.6rem',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
      role="region"
      aria-label="Language selection"
    >
      <GlobeIcon size={15} color="var(--text-secondary)" />
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        aria-label="Select Application Language"
        style={{
          background: 'transparent',
          color: 'var(--text-primary)',
          border: 'none',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        <option value="en" style={{ background: '#1e293b' }}>English</option>
        <option value="hi" style={{ background: '#1e293b' }}>हिन्दी (Hindi)</option>
        <option value="mr" style={{ background: '#1e293b' }}>मराठी (Marathi)</option>
      </select>
    </div>
  );
};
