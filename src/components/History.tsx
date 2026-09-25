import React from 'react';
import type { SessionRecord } from '../types';
import { CONDITION_DETAILS } from '../types';

interface HistoryProps {
  history: SessionRecord[];
  activeDay: number;
  totalDays: number;
  onBack: () => void;
}

export const History: React.FC<HistoryProps> = ({
  history,
  activeDay,
  totalDays,
  onBack
}) => {
  return (
    <div className="history-screen card" style={{ padding: '2rem' }}>
      <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ color: 'var(--accent-primary)', marginBottom: '0.25rem' }}>
            Session History Log
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {history.length} completed session{history.length === 1 ? '' : 's'} · Program Day {activeDay} of {totalDays}
          </p>
        </div>
        <button className="btn-secondary" onClick={onBack}>
          ← Back to Dashboard
        </button>
      </div>

      {history.length === 0 ? (
        <div style={{ background: '#0f172a', padding: '3rem', borderRadius: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No sessions recorded yet.</p>
          <p style={{ fontSize: '0.9rem' }}>Complete your first 10-minute chanting practice to log a session here.</p>
        </div>
      ) : (
        <div className="history-table-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table className="history-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.92rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #334155', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Day</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Date & Time</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Condition</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Key (Sa)</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Eval Acc.</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Mean Acc.</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Voiced Time</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => {
                const detail = CONDITION_DETAILS[item.condition];
                const dateStr = new Date(item.date).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '0.75rem 0.5rem', fontWeight: 700 }}>Day {item.dayIndex}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-secondary)' }}>{dateStr}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>
                      <span style={{ color: `var(--chakra-${item.condition})`, fontWeight: 600 }}>
                        {detail?.name}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{item.saNote} ({item.saHz.toFixed(0)} Hz)</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--success)', fontWeight: 600 }}>{item.evalAccuracy}%</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: 'var(--success)', fontWeight: 600 }}>{item.meanAccuracy}%</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}>{item.voicedSeconds}s</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
