import React from 'react';
import type { Institution } from '../game/types';
import { InstitutionCategory } from '../game/types';

interface InstitutionPanelProps {
  institutions: Institution[];
  onAdopt: (id: string) => void;
}

const categoryLabels: Record<InstitutionCategory, string> = {
  [InstitutionCategory.POLITICAL]: '政治',
  [InstitutionCategory.ECONOMIC]: '経済',
  [InstitutionCategory.SOCIAL]: '社会',
  [InstitutionCategory.MILITARY]: '軍事',
};

const categoryOrder: InstitutionCategory[] = [
  InstitutionCategory.POLITICAL,
  InstitutionCategory.ECONOMIC,
  InstitutionCategory.SOCIAL,
  InstitutionCategory.MILITARY,
];

function formatEffects(effects: Record<string, number>): string {
  return Object.entries(effects)
    .map(([k, v]) => `${k} ${v >= 0 ? '+' : ''}${v}`)
    .join(', ');
}

const InstitutionPanel: React.FC<InstitutionPanelProps> = ({ institutions, onAdopt }) => {
  const grouped = categoryOrder.map((cat) => ({
    category: cat,
    items: institutions.filter((i) => i.category === cat),
  }));

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>制度管理</h3>
      {grouped.map(({ category, items }) => (
        <div key={category} style={styles.group}>
          <h4 style={styles.groupTitle}>{categoryLabels[category]}</h4>
          {items.map((inst) => (
            <div key={inst.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.instName}>
                  {inst.adopted ? '✅ ' : ''}{inst.name}
                </span>
                {!inst.adopted && (
                  <button style={styles.adoptButton} onClick={() => onAdopt(inst.id)}>
                    採用
                  </button>
                )}
              </div>
              <p style={styles.desc}>{inst.description}</p>
              <p style={styles.effects}>効果: {formatEffects(inst.effects)}</p>
              <p style={styles.unlock}>条件: {inst.unlockConditions}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  panel: {
    background: '#0f3460',
    borderRadius: 8,
    padding: 16,
    border: '1px solid rgba(255,255,255,0.1)',
    maxHeight: 500,
    overflowY: 'auto',
  },
  title: {
    margin: '0 0 12px',
    fontSize: 16,
    color: '#fff',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    paddingBottom: 8,
  },
  group: {
    marginBottom: 12,
  },
  groupTitle: {
    margin: '0 0 8px',
    fontSize: 14,
    color: '#ffcc00',
    textTransform: 'uppercase' as const,
  },
  card: {
    background: '#1a1a2e',
    borderRadius: 6,
    padding: 10,
    marginBottom: 6,
    border: '1px solid rgba(255,255,255,0.05)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  instName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#eee',
  },
  adoptButton: {
    padding: '4px 12px',
    fontSize: 12,
    fontWeight: 'bold',
    background: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
  },
  desc: {
    margin: '0 0 4px',
    fontSize: 12,
    color: '#aaa',
    lineHeight: 1.4,
  },
  effects: {
    margin: '0 0 2px',
    fontSize: 11,
    color: '#53d769',
  },
  unlock: {
    margin: 0,
    fontSize: 11,
    color: '#888',
  },
};

export default InstitutionPanel;
