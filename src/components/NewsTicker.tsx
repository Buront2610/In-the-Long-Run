import React from 'react';
import type { NewsItem } from '../game/types';
import { NewsType } from '../game/types';

interface NewsTickerProps {
  news: NewsItem[];
}

const typeIcons: Record<NewsType, string> = {
  [NewsType.POLITICAL]: '🏛️',
  [NewsType.ECONOMIC]: '💰',
  [NewsType.SOCIAL]: '👥',
  [NewsType.MILITARY]: '⚔️',
  [NewsType.DIPLOMATIC]: '🌐',
};

const NewsTicker: React.FC<NewsTickerProps> = ({ news }) => {
  const items = news.slice(0, 10);

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>ニュース</h3>
      <div style={styles.list}>
        {items.length === 0 && (
          <p style={styles.empty}>ニュースはありません。</p>
        )}
        {items.map((item, i) => (
          <div key={i} style={styles.item}>
            <span style={styles.icon}>{typeIcons[item.type] ?? '📰'}</span>
            <span style={styles.year}>{item.year}年</span>
            <span style={styles.text}>{item.text}</span>
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
    margin: '0 0 10px',
    fontSize: 16,
    color: '#fff',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    paddingBottom: 8,
  },
  list: {
    maxHeight: 250,
    overflowY: 'auto' as const,
  },
  empty: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center' as const,
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '6px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  icon: {
    fontSize: 14,
    flexShrink: 0,
  },
  year: {
    fontSize: 11,
    color: '#ffcc00',
    fontWeight: 'bold',
    flexShrink: 0,
    minWidth: 42,
  },
  text: {
    fontSize: 13,
    color: '#ddd',
    lineHeight: 1.4,
  },
};

export default NewsTicker;
