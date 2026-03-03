import React from 'react';
import type { GameState } from '../game/types';
import { ERA_LABELS, GOVERNMENT_TYPE_LABELS } from '../game/constants';

interface TurnSummaryProps {
  state: GameState;
  onDismiss: () => void;
}

function getAdvisorMessage(state: GameState): { icon: string; message: string } {
  const econ = state.economic;
  const pol = state.political;

  if (econ.debtToGdpRatio > 150) {
    return { icon: '🚨', message: '債務が危険水域です！歳出削減か増税を検討してください。財政破綻が迫っています。' };
  }
  if (pol.stability < 20) {
    return { icon: '🚨', message: '政治的安定が極めて低いです。不満の原因を特定し、対処しなければ体制が崩壊します。' };
  }
  if (pol.unrest > 70) {
    return { icon: '⚠️', message: '国民の不満が非常に高まっています。福祉の拡充や減税で不満を緩和することを検討してください。' };
  }
  if (econ.inflation > 10) {
    return { icon: '⚠️', message: '高インフレが経済を蝕んでいます。中央銀行の設立や財政引き締めを検討してください。' };
  }
  if (econ.unemployment > 12) {
    return { icon: '⚠️', message: '失業率が高水準です。インフラ投資や減税で雇用を創出することを検討してください。' };
  }
  if (econ.fiscalBalance < -econ.gdp * 0.05) {
    return { icon: '📊', message: '財政赤字が拡大しています。歳出の見直しか、経済成長による歳入増を目指しましょう。' };
  }
  if (pol.corruption > 60) {
    return { icon: '📊', message: '腐敗が深刻です。反腐敗キャンペーンの実施や、制度改革による構造的対策を検討してください。' };
  }
  if (econ.giniCoefficient > 0.5) {
    return { icon: '📊', message: '格差が拡大しています。累進課税や福祉の拡充で再分配を強化することを検討してください。' };
  }
  if (econ.gdpGrowth > 3 && pol.stability > 50) {
    return { icon: '✨', message: '経済は好調です。この機会に制度の整備や債務の返済を進めましょう。' };
  }
  if (state.institutions.filter(i => i.adopted).length < 3) {
    return { icon: '💡', message: '制度の採用を検討してください。制度は国家の長期的な発展の基盤となります。「制度」タブをチェック。' };
  }
  return { icon: '📋', message: '現状は安定しています。長期的な成長戦略を検討する良い機会です。' };
}

function formatChange(current: number, previous: number, suffix = ''): React.ReactNode {
  const delta = current - previous;
  if (Math.abs(delta) < 0.01) return <span style={{ color: '#aaa' }}>→ 変化なし</span>;
  const color = delta > 0 ? '#53d769' : '#e94560';
  const arrow = delta > 0 ? '↑' : '↓';
  return (
    <span style={{ color, fontWeight: 'bold' }}>
      {arrow} {delta > 0 ? '+' : ''}{delta.toFixed(1)}{suffix}
    </span>
  );
}

const TurnSummary: React.FC<TurnSummaryProps> = ({ state, onDismiss }) => {
  const history = state.history;
  if (history.length < 2) return null;

  const prev = history[history.length - 2];
  const curr = history[history.length - 1];
  if (!prev || !curr) return null;

  const advisor = getAdvisorMessage(state);

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.title}>📜 {state.year}年 — {ERA_LABELS[state.era]}</span>
          <button style={styles.close} onClick={onDismiss}>✕</button>
        </div>

        <div style={styles.govInfo}>
          {GOVERNMENT_TYPE_LABELS[state.political.governmentType]}
        </div>

        <div style={styles.changes}>
          <div style={styles.changeRow}>
            <span style={styles.changeLabel}>GDP成長</span>
            <span style={styles.changeValue}>
              {state.economic.gdpGrowth >= 0 ? '+' : ''}{state.economic.gdpGrowth.toFixed(1)}% {formatChange(curr.gdp, prev.gdp)}
            </span>
          </div>
          <div style={styles.changeRow}>
            <span style={styles.changeLabel}>インフレ率</span>
            <span style={styles.changeValue}>
              {state.economic.inflation.toFixed(1)}% {formatChange(curr.inflation, prev.inflation, '%')}
            </span>
          </div>
          <div style={styles.changeRow}>
            <span style={styles.changeLabel}>失業率</span>
            <span style={styles.changeValue}>
              {state.economic.unemployment.toFixed(1)}% {formatChange(curr.unemployment, prev.unemployment, '%')}
            </span>
          </div>
          <div style={styles.changeRow}>
            <span style={styles.changeLabel}>安定度</span>
            <span style={styles.changeValue}>
              {state.political.stability.toFixed(0)} {formatChange(curr.stability, prev.stability)}
            </span>
          </div>
        </div>

        <div style={styles.advisorBox}>
          <span style={styles.advisorIcon}>{advisor.icon}</span>
          <div style={styles.advisorContent}>
            <span style={styles.advisorLabel}>顧問の助言</span>
            <span style={styles.advisorText}>{advisor.message}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'fixed',
    top: 80,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 800,
    maxWidth: 480,
    width: '90%',
  },
  card: {
    background: '#16213e',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: '16px 20px',
    boxShadow: '0 6px 30px rgba(0,0,0,0.5)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  close: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: 14,
    cursor: 'pointer',
  },
  govInfo: {
    fontSize: 12,
    color: '#ffcc00',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  changes: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 6,
    marginBottom: 12,
  },
  changeRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  changeLabel: {
    fontSize: 10,
    color: '#aaa',
  },
  changeValue: {
    fontSize: 13,
    color: '#eee',
  },
  advisorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: 'rgba(74,158,255,0.08)',
    border: '1px solid rgba(74,158,255,0.2)',
    borderRadius: 6,
    padding: '10px 12px',
  },
  advisorIcon: {
    fontSize: 20,
    flexShrink: 0,
  },
  advisorContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  advisorLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4a9eff',
  },
  advisorText: {
    fontSize: 12,
    color: '#ccc',
    lineHeight: 1.5,
  },
};

export default TurnSummary;
