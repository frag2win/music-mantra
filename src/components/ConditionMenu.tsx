import React from 'react';
import type { HealthCondition, ConditionDetail } from '../types';
import { CONDITION_DETAILS } from '../types';

interface ConditionMenuProps {
  selectedSaNote: string;
  selectedSaHz: number;
  onSelectCondition: (condition: HealthCondition) => void;
  onReSing: () => void;
}

export const ConditionMenu: React.FC<ConditionMenuProps> = ({
  selectedSaNote,
  selectedSaHz,
  onSelectCondition,
  onReSing
}) => {
  const conditions: ConditionDetail[] = [
    CONDITION_DETAILS.diabetes,
    CONDITION_DETAILS.thyroid,
    CONDITION_DETAILS.hypertension
  ];

  const getBorderColor = (id: HealthCondition) => {
    switch (id) {
      case 'diabetes':
        return 'var(--chakra-manipura)';
      case 'thyroid':
        return 'var(--chakra-vishuddha)';
      case 'hypertension':
        return 'var(--chakra-anahata)';
    }
  };

  return (
    <div className="condition-menu-screen card" style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }}>
        Step 3: Select Health Condition & Mantra
      </h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Active Key (Sa): <strong style={{ color: 'var(--text-primary)' }}>{selectedSaNote} ({selectedSaHz.toFixed(1)} Hz)</strong>
        {' '}· <button style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', textDecoration: 'underline', cursor: 'pointer', padding: 0 }} onClick={onReSing}>Change Sa</button>
      </p>

      {/* 3 Condition Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {conditions.map((item) => {
          const color = getBorderColor(item.id);
          const targetHz = selectedSaHz * item.ratio;

          return (
            <div
              key={item.id}
              className="card"
              style={{
                textAlign: 'left',
                borderLeft: `6px solid ${color}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>{item.name}</h3>
                  <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#0f172a', color }}>
                    {item.chakra}
                  </span>
                </div>

                <div style={{ margin: '1rem 0' }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>MANTRA & SWARA</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    "{item.mantra}" <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 400 }}>({item.swar})</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  <div>Target Pitch: <strong style={{ color: 'var(--text-primary)' }}>{targetHz.toFixed(1)} Hz</strong></div>
                  <div>Just Intonation: +{item.cents} cents</div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  {item.description}
                </p>
              </div>

              <button
                className="btn-primary"
                style={{ width: '100%', backgroundColor: color }}
                onClick={() => onSelectCondition(item.id)}
              >
                Select {item.name}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
