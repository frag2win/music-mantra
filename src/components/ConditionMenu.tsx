import React from 'react';
import type { HealthCondition, ConditionDetail } from '../types';
import { CONDITION_DETAILS } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { useOptionalTheme } from '../theme/ThemeContext';
import { CHAKRA_THEMES } from '../theme/chakraThemes';
import { SunIcon, LeafIcon, WaveIcon, ArrowLeftIcon, CheckIcon } from './common/Icons';

interface ConditionMenuProps {
  selectedSaNote: string;
  selectedSaHz: number;
  selectedCondition?: HealthCondition | null;
  onSelectCondition: (condition: HealthCondition) => void;
  onReSing: () => void;
  onBack?: () => void;
}

export const ConditionMenu: React.FC<ConditionMenuProps> = ({
  selectedSaNote,
  selectedSaHz,
  selectedCondition,
  onSelectCondition,
  onReSing,
  onBack
}) => {
  const { t } = useI18n();
  const themeContext = useOptionalTheme();
  const conditions: ConditionDetail[] = [
    CONDITION_DETAILS.diabetes,
    CONDITION_DETAILS.thyroid,
    CONDITION_DETAILS.hypertension
  ];

  return (
    <div className="condition-menu-screen card" style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
        Step 3: Select Health Condition & Mantra
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Active Key (Sa): <strong style={{ color: 'var(--text-primary)' }}>{selectedSaNote} ({selectedSaHz.toFixed(1)} Hz)</strong>
        {' '}· <button style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', textDecoration: 'underline', cursor: 'pointer', padding: 0 }} onClick={onReSing}>Change Sa</button>
      </p>

      {/* 3 Condition Cards Grid with Interactive Theme Previews */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {conditions.map((item) => {
          const chakraTheme = CHAKRA_THEMES[item.id];
          const targetHz = selectedSaHz * item.ratio;
          const isPreviewing = themeContext?.previewCondition === item.id;
          const isSelected = selectedCondition === item.id;

          return (
            <div
              key={item.id}
              className="card"
              onMouseEnter={() => themeContext?.setPreviewCondition(item.id)}
              onMouseLeave={() => themeContext?.setPreviewCondition(null)}
              onFocus={() => themeContext?.setPreviewCondition(item.id)}
              onBlur={() => themeContext?.setPreviewCondition(null)}
              tabIndex={0}
              style={{
                textAlign: 'left',
                borderLeft: `6px solid ${chakraTheme.accent}`,
                borderColor: isSelected ? chakraTheme.accent : isPreviewing ? chakraTheme.accent : undefined,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                transform: isSelected ? 'scale(1.02)' : isPreviewing ? 'translateY(-4px)' : 'none',
                boxShadow: isSelected
                  ? `0 0 24px ${chakraTheme.accentSoft}, 0 12px 28px -6px rgba(0, 0, 0, 0.4)`
                  : isPreviewing
                  ? `0 12px 28px -6px ${chakraTheme.accentSoft}, 0 0 16px ${chakraTheme.accent}33`
                  : undefined,
                cursor: 'pointer',
              }}
              onClick={() => onSelectCondition(item.id)}
            >
              <div>
                {/* Header with Chakra Badge and Mini Animated Swatch */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        padding: '0.3rem 0.75rem',
                        borderRadius: '14px 3px 14px 3px',
                        background: chakraTheme.accentSoft,
                        color: chakraTheme.accent,
                        border: `1px solid ${chakraTheme.accent}44`,
                      }}
                    >
                      {chakraTheme.chakraName} ({t(`conditions.${item.id}.chakra`)})
                    </span>
                    {isSelected && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.25rem 0.6rem',
                          borderRadius: '12px 3px 12px 3px',
                          background: chakraTheme.accent,
                          color: item.id === 'diabetes' ? '#1c1917' : '#ffffff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <CheckIcon size={11} /> Current
                      </span>
                    )}
                  </div>

                  {/* Mini Theme Swatch Icon */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '12px 3px 12px 3px',
                      background: `radial-gradient(circle, ${chakraTheme.accent} 0%, ${chakraTheme.bgGradient.from} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 0 8px ${chakraTheme.accent}66`,
                    }}
                    title={`Chakra Geometry: ${chakraTheme.sacredGeometry.type}`}
                  >
                    {item.id === 'diabetes' && <SunIcon size={16} color="#ffffff" />}
                    {item.id === 'hypertension' && <LeafIcon size={16} color="#ffffff" />}
                    {item.id === 'thyroid' && <WaveIcon size={16} color="#ffffff" />}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {t(`conditions.${item.id}.name`)}
                </h3>

                <div style={{ margin: '1rem 0' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>SEED MANTRA & SWARA</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: chakraTheme.accent }}>
                    "{t(`conditions.${item.id}.mantra`)}" <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({t(`conditions.${item.id}.swar`)})</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                  <div>Target Resonance: <strong style={{ color: 'var(--text-primary)' }}>{targetHz.toFixed(1)} Hz</strong></div>
                  <div>Harmonic Ratio: <strong>{item.ratio.toFixed(3)}</strong> (+{item.cents} cents)</div>
                </div>

                <div
                  style={{
                    fontSize: '0.8rem',
                    color: '#cbd5e1',
                    background: 'rgba(15, 23, 42, 0.5)',
                    padding: '0.65rem 0.9rem',
                    borderRadius: '16px 4px 16px 4px',
                    marginBottom: '1rem',
                    borderLeft: `3px solid ${chakraTheme.accent}`,
                  }}
                >
                  <strong style={{ color: chakraTheme.accent }}>Intent:</strong> {chakraTheme.emotionalIntent}
                </div>
              </div>

              <button
                type="button"
                className="btn-primary"
                style={{
                  width: '100%',
                  background: `radial-gradient(ellipse 110% 80% at 50% -20%, rgba(255, 255, 255, 0.38) 0%, rgba(255, 255, 255, 0) 65%), linear-gradient(135deg, ${chakraTheme.accent} 0%, ${chakraTheme.secondaryAccent} 100%)`,
                  color: item.id === 'diabetes' ? '#1c1917' : '#ffffff',
                  textShadow: item.id === 'diabetes' ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.4)',
                  boxShadow: `0 4px 20px -2px ${chakraTheme.accentSoft}, 0 0 28px -4px ${chakraTheme.accentSoft}`,
                  border: '1px solid rgba(255, 255, 255, 0.35)',
                  padding: '0.85rem 1.5rem',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCondition(item.id);
                }}
              >
                {selectedCondition === item.id ? 'Continue with' : 'Select'} {t(`conditions.${item.id}.name`)} Theme
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
        {onBack && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onBack}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ArrowLeftIcon size={16} /> Back to Scale Tuning
          </button>
        )}
      </div>
    </div>
  );
};

