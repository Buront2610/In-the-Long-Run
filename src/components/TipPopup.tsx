import React from 'react';
import type { Tip } from '../game/types';

interface TipPopupProps {
  tips: Tip[];
  onDismiss: () => void;
}

const TipPopup: React.FC<TipPopupProps> = ({ tips, onDismiss }) => {
  if (tips.length === 0) return null;

  const tip = tips[0];

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <button style={styles.close} onClick={onDismiss}>✕</button>
        <p style={styles.quote}>「{tip.text}」</p>
        <p style={styles.author}>― {tip.author}</p>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'fixed',
    bottom: 20,
    right: 20,
    zIndex: 900,
    maxWidth: 360,
  },
  card: {
    background: '#16213e',
    border: '1px solid rgba(233,69,96,0.4)',
    borderRadius: 8,
    padding: '16px 20px',
    position: 'relative',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  },
  close: {
    position: 'absolute',
    top: 6,
    right: 10,
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: 14,
    cursor: 'pointer',
  },
  quote: {
    margin: '0 0 8px',
    fontSize: 14,
    color: '#eee',
    lineHeight: 1.6,
    fontStyle: 'italic',
  },
  author: {
    margin: 0,
    fontSize: 12,
    color: '#e94560',
    textAlign: 'right' as const,
  },
};

export default TipPopup;
