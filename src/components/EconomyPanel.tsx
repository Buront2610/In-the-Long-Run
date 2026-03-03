import React from 'react';
import type { EconomicState } from '../game/types';

interface EconomyPanelProps {
  economic: EconomicState;
}

type BadgeLevel = 'good' | 'warning' | 'danger';

const badgeColors: Record<BadgeLevel, string> = {
  good: '#53d769',
  warning: '#ffcc00',
  danger: '#e94560',
};

function getBadge(value: number, goodMax: number, warnMax: number, invert = false): BadgeLevel {
  if (invert) {
    if (value <= goodMax) return 'good';
    if (value <= warnMax) return 'warning';
    return 'danger';
  }
  if (value >= goodMax) return 'good';
  if (value >= warnMax) return 'warning';
  return 'danger';
}

function formatNum(n: number, decimals = 1): string {
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(decimals) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(decimals) + 'K';
  return n.toFixed(decimals);
}

const EconomyPanel: React.FC<EconomyPanelProps> = ({ economic }) => {
  const indicators: { label: string; value: string; badge: BadgeLevel }[] = [
    {
      label: 'GDP',
      value: `${formatNum(economic.gdp)} (${economic.gdpGrowth >= 0 ? '+' : ''}${economic.gdpGrowth.toFixed(1)}%)`,
      badge: getBadge(economic.gdpGrowth, 2, 0),
    },
    {
      label: '人口',
      value: `${formatNum(economic.population)} (${economic.populationGrowth >= 0 ? '+' : ''}${economic.populationGrowth.toFixed(1)}%)`,
      badge: getBadge(economic.populationGrowth, 0.5, 0),
    },
    {
      label: 'インフレ率',
      value: `${economic.inflation.toFixed(1)}%`,
      badge: getBadge(economic.inflation, 3, 8, true),
    },
    {
      label: '失業率',
      value: `${economic.unemployment.toFixed(1)}%`,
      badge: getBadge(economic.unemployment, 5, 12, true),
    },
    {
      label: '国庫',
      value: formatNum(economic.treasury),
      badge: getBadge(economic.treasury, 100, 20),
    },
    {
      label: '債務',
      value: `${formatNum(economic.debt)} (対GDP ${economic.debtToGdpRatio.toFixed(0)}%)`,
      badge: getBadge(economic.debtToGdpRatio, 60, 100, true),
    },
    {
      label: '財政収支',
      value: `${economic.fiscalBalance >= 0 ? '+' : ''}${formatNum(economic.fiscalBalance)} (GDP比 ${((economic.fiscalBalance / (economic.gdp || 1)) * 100).toFixed(1)}%)`,
      badge: getBadge(economic.fiscalBalance, 0, -50),
    },
    {
      label: '貿易収支',
      value: formatNum(economic.tradeBalance),
      badge: getBadge(economic.tradeBalance, 0, -10),
    },
    {
      label: 'ジニ係数',
      value: economic.giniCoefficient.toFixed(3),
      badge: getBadge(economic.giniCoefficient, 0.35, 0.5, true),
    },
  ];

  // War economy badge
  const warEconomyBadge = economic.isWarEconomy ? {
    label: '総力戦経済',
    value: `国防費 GDP比 ${economic.governmentSpending.defense.toFixed(1)}%`,
    badge: 'danger' as BadgeLevel,
  } : null;

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>経済指標</h3>
      {warEconomyBadge && (
        <div style={styles.warBanner}>
          <span style={styles.warIcon}>!</span>
          {warEconomyBadge.label}: {warEconomyBadge.value}
        </div>
      )}
      <div style={styles.grid}>
        {indicators.map((ind) => (
          <div key={ind.label} style={styles.item}>
            <div style={styles.labelRow}>
              <span
                style={{
                  ...styles.badge,
                  background: badgeColors[ind.badge],
                }}
              />
              <span style={styles.label}>{ind.label}</span>
            </div>
            <span style={styles.value}>{ind.value}</span>
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
  warBanner: {
    background: 'rgba(233,69,96,0.15)',
    border: '1px solid #e94560',
    borderRadius: 6,
    padding: '6px 10px',
    marginBottom: 10,
    fontSize: 12,
    color: '#e94560',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  warIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#e94560',
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    flexShrink: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  labelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  label: {
    fontSize: 12,
    color: '#aaa',
  },
  value: {
    fontSize: 14,
    color: '#eee',
    fontWeight: 'bold',
    paddingLeft: 14,
  },
};

export default EconomyPanel;
