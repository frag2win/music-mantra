import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';
import { GlobeIcon, ChevronDownIcon, CheckIcon } from '../components/common/Icons';

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Locale; label: string; nativeName: string }[] = [
    { code: 'en', label: 'English', nativeName: 'English' },
    { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'mr', label: 'Marathi', nativeName: 'मराठी' },
  ];

  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={dropdownRef}
      className={`custom-dropdown ${className || ''}`}
      style={{ position: 'relative', display: 'inline-block' }}
      role="region"
      aria-label="Language selection"
    >
      <button
        type="button"
        className="custom-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          background: isOpen ? 'rgba(30, 41, 59, 0.95)' : 'rgba(30, 41, 59, 0.75)',
          padding: '0.35rem 0.65rem',
          borderRadius: '9999px',
          border: '1px solid rgba(148, 163, 184, 0.25)',
          color: 'var(--text-primary)',
          fontSize: '0.82rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(10px)',
          boxShadow: isOpen ? '0 0 12px rgba(99, 102, 241, 0.3)' : '0 1px 4px rgba(0, 0, 0, 0.2)',
        }}
      >
        <GlobeIcon size={14} color="var(--accent-primary)" />
        <span>{currentLang.nativeName}</span>
        <ChevronDownIcon
          size={12}
          color="var(--text-secondary)"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: '150px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            borderRadius: '12px',
            boxShadow: '0 12px 30px -4px rgba(0, 0, 0, 0.5), 0 0 16px rgba(99, 102, 241, 0.15)',
            backdropFilter: 'blur(16px)',
            padding: '0.35rem',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
            animation: 'fadeInMenu 0.15s ease-out',
          }}
        >
          {languages.map((item) => {
            const isSelected = item.code === locale;
            return (
              <button
                key={item.code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLocale(item.code);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.45rem 0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                  fontSize: '0.82rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget.style.background = 'rgba(51, 65, 85, 0.5)');
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget.style.background = 'transparent');
                }}
              >
                <span>{item.nativeName} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({item.label})</span></span>
                {isSelected && <CheckIcon size={14} color="var(--accent-primary)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
