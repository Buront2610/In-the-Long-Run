import React from 'react';
import type { Institution } from '../game/types';
import { InstitutionCategory } from '../game/types';

interface InstitutionPanelProps {
  institutions: Institution[];
  onAdopt: (id: string) => void;
  onRevoke?: (id: string) => void;
  treasury?: number;
}

const categoryLabels: Record<InstitutionCategory, string> = {
  [InstitutionCategory.POLITICAL]: '🏛️ 政治制度',
  [InstitutionCategory.ECONOMIC]: '💰 経済制度',
  [InstitutionCategory.SOCIAL]: '🏥 社会制度',
  [InstitutionCategory.MILITARY]: '⚔️ 軍事制度',
};

const categoryOrder: InstitutionCategory[] = [
  InstitutionCategory.POLITICAL,
  InstitutionCategory.ECONOMIC,
  InstitutionCategory.SOCIAL,
  InstitutionCategory.MILITARY,
];

const effectLabels: Record<string, string> = {
  corruption: '腐敗度',
  stability: '安定度',
  legitimacy: '正統性',
  unrest: '不満',
  bureaucracyEfficiency: '官僚効率',
  gdpGrowth: 'GDP成長率',
  inflation: 'インフレ率',
  tradeBalance: '貿易収支',
  giniCoefficient: 'ジニ係数',
  treasury: '国庫',
  unemployment: '失業率',
  populationGrowth: '人口増加率',
};

function formatEffects(effects: Record<string, number>): React.ReactNode {
  return (
    <span>
      {Object.entries(effects).map(([k, v], i) => {
        const label = effectLabels[k] ?? k;
        const color = v > 0
          ? (k === 'corruption' || k === 'unrest' || k === 'unemployment' || k === 'inflation' || k === 'giniCoefficient' ? '#e94560' : '#53d769')
          : (k === 'corruption' || k === 'unrest' || k === 'unemployment' || k === 'inflation' || k === 'giniCoefficient' ? '#53d769' : '#e94560');
        return (
          <span key={k}>
            {i > 0 ? '  ' : ''}
            <span style={{ color }}>{label} {v >= 0 ? '+' : ''}{v}</span>
          </span>
        );
      })}
    </span>
  );
}

function getPrerequisiteNames(inst: Institution, all: Institution[]): string[] {
  return inst.prerequisiteIds.map((id) => {
    const pre = all.find((i) => i.id === id);
    return pre ? pre.name : id;
  });
}

function arePrerequisitesMet(inst: Institution, all: Institution[]): boolean {
  return inst.prerequisiteIds.every((id) => {
    const pre = all.find((i) => i.id === id);
    return pre?.adopted;
  });
}

const InstitutionPanel: React.FC<InstitutionPanelProps> = ({ institutions, onAdopt, onRevoke, treasury }) => {
  const grouped = categoryOrder.map((cat) => ({
    category: cat,
    items: institutions.filter((i) => i.category === cat),
  }));

  const adoptedCount = institutions.filter((i) => i.adopted).length;

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>制度管理</h3>
      <p style={styles.subtitle}>
        採用済み制度: {adoptedCount}/{institutions.length} — 
        制度の採用には財源と政治的安定が必要です。前提条件を満たした制度のみ採用可能です。
      </p>
      {grouped.map(({ category, items }) => (
        <div key={category} style={styles.group}>
          <h4 style={styles.groupTitle}>{categoryLabels[category]}</h4>
          {items.map((inst) => {
            const prereqsMet = arePrerequisitesMet(inst, institutions);
            const prereqNames = getPrerequisiteNames(inst, institutions);
            const canAfford = (treasury ?? Infinity) >= inst.adoptionCost;
            const canAdopt = !inst.adopted && prereqsMet && canAfford;

            return (
              <div key={inst.id} style={{
                ...styles.card,
                ...(inst.adopted ? styles.cardAdopted : {}),
                ...(!inst.adopted && !prereqsMet ? styles.cardLocked : {}),
              }}>
                <div style={styles.cardHeader}>
                  <span style={styles.instName}>
                    {inst.adopted ? '✅ ' : (!prereqsMet ? '🔒 ' : '')}{inst.name}
                  </span>
                  <div style={styles.buttonGroup}>
                    {!inst.adopted && (
                      <button
                        style={{
                          ...styles.adoptButton,
                          ...(canAdopt ? {} : styles.adoptButtonDisabled),
                        }}
                        onClick={() => canAdopt && onAdopt(inst.id)}
                        disabled={!canAdopt}
                        title={!prereqsMet ? '前提条件未達成' : !canAfford ? '財源不足' : '採用する'}
                      >
                        採用 (💰{inst.adoptionCost})
                      </button>
                    )}
                    {inst.adopted && inst.revocable && onRevoke && (
                      <button
                        style={styles.revokeButton}
                        onClick={() => onRevoke(inst.id)}
                      >
                        廃止
                      </button>
                    )}
                    {inst.adopted && !inst.revocable && (
                      <span style={styles.permanentBadge}>恒久制度</span>
                    )}
                  </div>
                </div>
                <p style={styles.desc}>{inst.description}</p>
                <div style={styles.effectsRow}>
                  <span style={styles.effectsLabel}>効果:</span>
                  {formatEffects(inst.effects)}
                </div>
                {inst.stabilityImpact !== 0 && (
                  <p style={styles.costInfo}>
                    導入時安定度変化: <span style={{ color: inst.stabilityImpact < 0 ? '#e94560' : '#53d769' }}>
                      {inst.stabilityImpact > 0 ? '+' : ''}{inst.stabilityImpact}
                    </span>
                  </p>
                )}
                {prereqNames.length > 0 && (
                  <p style={styles.prereqs}>
                    前提制度: {prereqNames.map((name, i) => {
                      const preId = inst.prerequisiteIds[i];
                      const pre = institutions.find((ins) => ins.id === preId);
                      const met = pre?.adopted;
                      return (
                        <span key={preId} style={{ color: met ? '#53d769' : '#e94560' }}>
                          {met ? '✓' : '✗'}{name}{i < prereqNames.length - 1 ? '、' : ''}
                        </span>
                      );
                    })}
                  </p>
                )}
                <p style={styles.unlock}>解禁条件: {inst.unlockConditions}</p>
              </div>
            );
          })}
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
    maxHeight: 600,
    overflowY: 'auto',
  },
  title: {
    margin: '0 0 4px',
    fontSize: 16,
    color: '#fff',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    paddingBottom: 8,
  },
  subtitle: {
    margin: '0 0 12px',
    fontSize: 12,
    color: '#aaa',
    lineHeight: 1.4,
  },
  group: {
    marginBottom: 16,
  },
  groupTitle: {
    margin: '0 0 8px',
    fontSize: 14,
    color: '#ffcc00',
  },
  card: {
    background: '#1a1a2e',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
    border: '1px solid rgba(255,255,255,0.05)',
    transition: 'border-color 0.2s',
  },
  cardAdopted: {
    borderColor: 'rgba(83,215,105,0.3)',
    background: 'rgba(83,215,105,0.05)',
  },
  cardLocked: {
    opacity: 0.6,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  instName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#eee',
  },
  buttonGroup: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
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
    whiteSpace: 'nowrap' as const,
  },
  adoptButtonDisabled: {
    background: '#555',
    color: '#999',
    cursor: 'not-allowed',
  },
  revokeButton: {
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 'bold',
    background: 'transparent',
    color: '#e94560',
    border: '1px solid #e94560',
    borderRadius: 4,
    cursor: 'pointer',
  },
  permanentBadge: {
    fontSize: 10,
    color: '#53d769',
    padding: '2px 6px',
    border: '1px solid rgba(83,215,105,0.3)',
    borderRadius: 3,
  },
  desc: {
    margin: '0 0 6px',
    fontSize: 12,
    color: '#bbb',
    lineHeight: 1.5,
  },
  effectsRow: {
    margin: '0 0 4px',
    fontSize: 11,
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 2,
    alignItems: 'center',
  },
  effectsLabel: {
    color: '#888',
    marginRight: 4,
  },
  costInfo: {
    margin: '0 0 2px',
    fontSize: 11,
    color: '#aaa',
  },
  prereqs: {
    margin: '0 0 2px',
    fontSize: 11,
    color: '#aaa',
  },
  unlock: {
    margin: 0,
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
};

export default InstitutionPanel;
