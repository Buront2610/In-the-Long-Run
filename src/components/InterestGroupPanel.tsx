import React from 'react';
import type { InterestGroup, InterestGroupType } from '../game/types';

const GROUP_DESCRIPTIONS: Record<string, { desc: string; effect: string }> = {
  aristocracy: {
    desc: '伝統的な支配階級。低税率と財産権の保護を求める。',
    effect: '不満が高まると正統性が低下し、クーデターのリスクが上昇。',
  },
  military: {
    desc: '軍事組織とその関係者。国防費の拡大と装備の近代化を要求。',
    effect: '満足度が極端に低いとクーデターを起こす可能性がある。',
  },
  merchants: {
    desc: '商業・貿易に従事する層。自由貿易と規制緩和を支持。',
    effect: '貿易収支の改善と経済成長に貢献。不満時は資本流出のリスク。',
  },
  workers: {
    desc: '労働者階級。賃金向上、福祉充実、雇用保障を求める。',
    effect: '不満が蓄積するとストライキや革命のリスクが急上昇。',
  },
  farmers: {
    desc: '農業従事者。物価安定と農業保護政策を求める。',
    effect: '食糧生産の担い手。不満時は食糧供給に影響し社会不安を招く。',
  },
  intellectuals: {
    desc: '学者・教育者・専門家。教育と研究への投資拡大を主張。',
    effect: '長期的な技術発展と制度改革の推進力。不満時は改革運動を主導。',
  },
  bureaucrats: {
    desc: '行政官僚。安定した予算と人事の継続を重視。',
    effect: '官僚効率に直結。不満時は行政サービスの質が低下。',
  },
};

interface InterestGroupPanelProps {
  interestGroups: InterestGroup[];
}

function satColor(satisfaction: number): string {
  if (satisfaction >= 60) return '#53d769';
  if (satisfaction >= 35) return '#ffcc00';
  return '#e94560';
}

const InterestGroupPanel: React.FC<InterestGroupPanelProps> = ({ interestGroups }) => {
  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>利益団体</h3>
      <p style={{ margin: '0 0 10px', fontSize: 11, color: '#999', lineHeight: 1.4 }}>
        各利益団体の満足度はあなたの政策に直接反応します。影響力の高い団体の不満は政治的不安定に直結します。
      </p>
      <div style={styles.grid}>
        {interestGroups.map((group) => {
          const groupMeta = GROUP_DESCRIPTIONS[group.id];
          return (
          <div key={group.id} style={styles.card}>
            <div style={styles.name}>{group.name}</div>
            {groupMeta && (
              <div style={{ fontSize: 10, color: '#999', lineHeight: 1.3, marginBottom: 6 }}>
                {groupMeta.desc}
              </div>
            )}

            <div style={styles.barSection}>
              <span style={styles.barLabel}>影響力</span>
              <div style={styles.barBg}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${group.influence}%`,
                    background: '#4a9eff',
                  }}
                />
              </div>
              <span style={styles.barValue}>{group.influence}</span>
            </div>

            <div style={styles.barSection}>
              <span style={styles.barLabel}>満足度</span>
              <div style={styles.barBg}>
                <div
                  style={{
                    ...styles.barFill,
                    width: `${group.satisfaction}%`,
                    background: satColor(group.satisfaction),
                  }}
                />
              </div>
              <span style={styles.barValue}>{group.satisfaction}</span>
            </div>

            <div style={styles.demands}>
              {group.demands.map((d, i) => (
                <span key={i} style={styles.demandTag}>
                  {d}
                </span>
              ))}
            </div>
            {groupMeta && (
              <div style={{ fontSize: 10, color: group.satisfaction < 35 ? '#e94560' : '#777', marginTop: 4, lineHeight: 1.3, fontStyle: 'italic' }}>
                {groupMeta.effect}
              </div>
            )}
          </div>
          );
        })}
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 10,
  },
  card: {
    background: '#1a1a2e',
    borderRadius: 6,
    padding: 10,
    border: '1px solid rgba(255,255,255,0.05)',
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#eee',
    marginBottom: 8,
  },
  barSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#aaa',
    width: 48,
    flexShrink: 0,
  },
  barBg: {
    flex: 1,
    height: 6,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s',
  },
  barValue: {
    fontSize: 11,
    color: '#ccc',
    width: 24,
    textAlign: 'right' as const,
  },
  demands: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 4,
    marginTop: 6,
  },
  demandTag: {
    fontSize: 10,
    color: '#ddd',
    background: 'rgba(255,255,255,0.08)',
    padding: '2px 6px',
    borderRadius: 3,
  },
};

export default InterestGroupPanel;
