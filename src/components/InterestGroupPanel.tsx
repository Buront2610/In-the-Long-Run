import React from 'react';
import type { InterestGroup } from '../game/types';

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
      <div style={styles.grid}>
        {interestGroups.map((group) => (
          <div key={group.id} style={styles.card}>
            <div style={styles.name}>{group.name}</div>

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
          </div>
        ))}
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
