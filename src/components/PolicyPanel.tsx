import React from 'react';
import type { EconomicState } from '../game/types';

interface PolicyPanelProps {
  economic: EconomicState;
  onApplyPolicy: (action: string, value: number) => void;
}

const spendingCategories: { key: keyof EconomicState['governmentSpending']; label: string }[] = [
  { key: 'defense', label: '国防' },
  { key: 'education', label: '教育' },
  { key: 'infrastructure', label: 'インフラ' },
  { key: 'welfare', label: '福祉' },
  { key: 'research', label: '研究' },
];

const PolicyPanel: React.FC<PolicyPanelProps> = ({ economic, onApplyPolicy }) => {
  const sp = economic.governmentSpending;
  const totalSpending = sp.defense + sp.education + sp.infrastructure + sp.welfare + sp.research;

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>政策設定</h3>

      <div style={styles.section}>
        <div style={styles.sliderHeader}>
          <span style={styles.label}>税率</span>
          <span style={styles.value}>{economic.taxRate}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={economic.taxRate}
          onChange={(e) => onApplyPolicy('tax_rate', Number(e.target.value))}
          style={styles.slider}
        />
      </div>

      <div style={styles.divider} />

      <div style={styles.sectionHeader}>
        <span style={styles.label}>歳出配分</span>
        <span style={{
          ...styles.totalBadge,
          color: totalSpending > 100 ? '#e94560' : totalSpending > 80 ? '#ffcc00' : '#53d769',
        }}>
          合計: {totalSpending}%
        </span>
      </div>

      {spendingCategories.map(({ key, label }) => (
        <div key={key} style={styles.section}>
          <div style={styles.sliderHeader}>
            <span style={styles.label}>{label}</span>
            <span style={styles.value}>{sp[key]}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={sp[key]}
            onChange={(e) => onApplyPolicy(`spending_${key}`, Number(e.target.value))}
            style={styles.slider}
          />
        </div>
      ))}

      <div style={styles.divider} />

      <div style={styles.actions}>
        <button
          style={styles.actionButton}
          onClick={() => onApplyPolicy('anti_corruption', 10)}
        >
          反腐敗キャンペーン
        </button>
        <button
          style={styles.actionButton}
          onClick={() => onApplyPolicy('promote_trade', 5)}
        >
          貿易促進
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    background: '#0f3460',
    borderRadius: 8,
    padding: 16,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  title: {
    margin: '0 0 12px',
    fontSize: 16,
    color: '#fff',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    paddingBottom: 8,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  label: {
    fontSize: 13,
    color: '#ccc',
  },
  value: {
    fontSize: 13,
    color: '#ffcc00',
    fontWeight: 'bold',
  },
  totalBadge: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    accentColor: '#e94560',
    cursor: 'pointer',
  },
  divider: {
    borderTop: '1px solid rgba(255,255,255,0.1)',
    margin: '12px 0',
  },
  actions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  actionButton: {
    flex: 1,
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 'bold',
    background: '#1a1a2e',
    color: '#eee',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 6,
    cursor: 'pointer',
  },
};

export default PolicyPanel;
