import React, { useState } from 'react';
import type { HistoryRecord } from '../game/types';

interface HistoryChartProps {
  history: HistoryRecord[];
}

type MetricKey = 'gdp' | 'population' | 'inflation' | 'unemployment' | 'stability' | 'corruption';

const metrics: { key: MetricKey; label: string; color: string }[] = [
  { key: 'gdp', label: 'GDP', color: '#53d769' },
  { key: 'population', label: '人口', color: '#4a9eff' },
  { key: 'inflation', label: 'インフレ率', color: '#ffcc00' },
  { key: 'unemployment', label: '失業率', color: '#e94560' },
  { key: 'stability', label: '安定度', color: '#9b59b6' },
  { key: 'corruption', label: '腐敗度', color: '#e67e22' },
];

const CHART_W = 500;
const CHART_H = 200;
const PADDING = { top: 20, right: 20, bottom: 30, left: 50 };

const integerMetrics = new Set<MetricKey>(['gdp', 'population']);

function formatTickValue(metric: MetricKey, value: number): string {
  return integerMetrics.has(metric) ? value.toFixed(0) : value.toFixed(1);
}

const HistoryChart: React.FC<HistoryChartProps> = ({ history }) => {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('gdp');

  const data = history.slice(-50);
  const metric = metrics.find((m) => m.key === activeMetric)!;

  if (data.length < 2) {
    return (
      <div style={styles.panel}>
        <h3 style={styles.title}>歴史チャート</h3>
        <p style={styles.empty}>データが不足しています。ターンを進めてください。</p>
      </div>
    );
  }

  const values = data.map((d) => d[activeMetric]);
  const years = data.map((d) => d.year);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valRange = maxVal - minVal || 1;

  const plotW = CHART_W - PADDING.left - PADDING.right;
  const plotH = CHART_H - PADDING.top - PADDING.bottom;

  const points = data.map((d, i) => {
    const x = PADDING.left + (i / (data.length - 1)) * plotW;
    const y = PADDING.top + plotH - ((d[activeMetric] - minVal) / valRange) * plotH;
    return `${x},${y}`;
  });

  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks }, (_, i) => {
    const val = minVal + (valRange * i) / (yTicks - 1);
    const y = PADDING.top + plotH - (i / (yTicks - 1)) * plotH;
    return { val, y };
  });

  const xTickCount = Math.min(data.length, 6);
  const xLabels = Array.from({ length: xTickCount }, (_, i) => {
    const idx = Math.round((i / (xTickCount - 1)) * (data.length - 1));
    const x = PADDING.left + (idx / (data.length - 1)) * plotW;
    return { year: years[idx], x };
  });

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>歴史チャート</h3>
      <div style={styles.tabs}>
        {metrics.map((m) => (
          <button
            key={m.key}
            style={{
              ...styles.tab,
              ...(activeMetric === m.key ? { background: m.color, color: '#111' } : {}),
            }}
            onClick={() => setActiveMetric(m.key)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} style={styles.svg}>
        {/* Grid lines */}
        {yLabels.map((t, i) => (
          <g key={i}>
            <line
              x1={PADDING.left}
              y1={t.y}
              x2={CHART_W - PADDING.right}
              y2={t.y}
              stroke="rgba(255,255,255,0.08)"
            />
            <text x={PADDING.left - 6} y={t.y + 4} fill="#888" fontSize="9" textAnchor="end">
              {formatTickValue(activeMetric, t.val)}
            </text>
          </g>
        ))}
        {/* X labels */}
        {xLabels.map((t, i) => (
          <text
            key={i}
            x={t.x}
            y={CHART_H - 5}
            fill="#888"
            fontSize="9"
            textAnchor="middle"
          >
            {t.year}
          </text>
        ))}
        {/* Line */}
        <polyline
          points={points.join(' ')}
          fill="none"
          stroke={metric.color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Dots at last point */}
        {data.length > 0 && (
          <circle
            cx={parseFloat(points[points.length - 1].split(',')[0])}
            cy={parseFloat(points[points.length - 1].split(',')[1])}
            r="3"
            fill={metric.color}
          />
        )}
      </svg>
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
  empty: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center' as const,
    padding: 20,
  },
  tabs: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap' as const,
    marginBottom: 10,
  },
  tab: {
    padding: '4px 10px',
    fontSize: 11,
    background: 'rgba(255,255,255,0.08)',
    color: '#ccc',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  svg: {
    width: '100%',
    height: 'auto',
  },
};

export default HistoryChart;
