import React from 'react';
import type { GameState } from '../game/types';

interface GameOverScreenProps {
  state: GameState;
  onRestart: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ state, onRestart }) => {
  const startYear = state.scenario?.startYear ?? state.history[0]?.year ?? 0;
  const yearsSurvived = state.year - startYear;
  const maxGdp = state.history.length > 0
    ? Math.max(...state.history.map((h) => h.gdp))
    : state.economic.gdp;
  const lastNews = state.news.length > 0 ? state.news[0] : null;

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h1 style={styles.title}>ゲームオーバー</h1>

        <div style={styles.stats}>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>生存年数</span>
            <span style={styles.statValue}>{yearsSurvived}年</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>最大GDP</span>
            <span style={styles.statValue}>{maxGdp.toFixed(1)}</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>最終人口</span>
            <span style={styles.statValue}>{state.economic.population.toFixed(1)}</span>
          </div>
          <div style={styles.statRow}>
            <span style={styles.statLabel}>最終年</span>
            <span style={styles.statValue}>{state.year}年</span>
          </div>
        </div>

        {lastNews && (
          <div style={styles.newsBox}>
            <p style={styles.newsText}>{lastNews.text}</p>
          </div>
        )}

        <button style={styles.restartButton} onClick={onRestart}>
          最初からやり直す
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  card: {
    background: '#1a1a2e',
    border: '1px solid rgba(233,69,96,0.4)',
    borderRadius: 12,
    padding: '36px 40px',
    maxWidth: 440,
    width: '90%',
    textAlign: 'center' as const,
    boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
  },
  title: {
    margin: '0 0 24px',
    fontSize: 32,
    color: '#e94560',
    fontWeight: 'bold',
  },
  stats: {
    marginBottom: 20,
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  statLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  statValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  newsBox: {
    background: 'rgba(233,69,96,0.1)',
    border: '1px solid rgba(233,69,96,0.3)',
    borderRadius: 6,
    padding: '10px 14px',
    marginBottom: 24,
  },
  newsText: {
    margin: 0,
    fontSize: 13,
    color: '#e94560',
    lineHeight: 1.5,
  },
  restartButton: {
    padding: '12px 36px',
    fontSize: 16,
    fontWeight: 'bold',
    background: '#e94560',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    letterSpacing: 1,
  },
};

export default GameOverScreen;
