import React, { useState } from 'react';
import type { EconomicState, PoliticalState } from '../game/types';
import { Era } from '../game/types';
import { GOVERNMENT_TYPE_LABELS, ERA_LABELS } from '../game/constants';

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorldMapProps {
  playerNation: string;
  era: Era;
  year: number;
  economic: EconomicState;
  political: PoliticalState;
}

type DiplomaticStance = 'player' | 'friendly' | 'neutral' | 'rival' | 'hostile';

interface RegionData {
  id: string;
  name: string;
  nameEn: string;
  points: string;
  labelX: number;
  labelY: number;
  controller: string;
  stance: DiplomaticStance;
  gdpFactor: number;
  militaryFactor: number;
}

interface TradeRoute {
  from: string;
  to: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STANCE_COLORS: Record<DiplomaticStance, string> = {
  player: '#e94560',
  friendly: '#53d769',
  neutral: '#4a9eff',
  rival: '#ffcc00',
  hostile: '#ff6b35',
};

const STANCE_LABELS: Record<DiplomaticStance, string> = {
  player: '自国',
  friendly: '友好',
  neutral: '中立',
  rival: '競合',
  hostile: '敵対',
};

const AI_NATION_NAMES = [
  '鉄壁帝国',
  '翡翠連邦',
  '黄金王朝',
  '紅蓮共和国',
  '蒼穹同盟',
  '暁の公国',
  '深淵評議会',
];

const STANCES: DiplomaticStance[] = ['friendly', 'neutral', 'rival', 'hostile'];

const BASE_REGIONS: Omit<RegionData, 'controller' | 'stance' | 'gdpFactor' | 'militaryFactor'>[] = [
  {
    id: 'northern',
    name: '北方大陸',
    nameEn: 'Northern Continent',
    points: '80,30 200,20 340,35 380,80 350,130 240,140 120,120 60,80',
    labelX: 210,
    labelY: 80,
  },
  {
    id: 'central',
    name: '中央平原',
    nameEn: 'Central Plains',
    points: '160,160 300,150 380,170 400,230 360,280 220,290 140,260 120,200',
    labelX: 260,
    labelY: 220,
  },
  {
    id: 'eastern',
    name: '東方諸島',
    nameEn: 'Eastern Islands',
    points: '580,80 640,60 700,75 730,120 720,180 670,200 610,170 570,130',
    labelX: 650,
    labelY: 130,
  },
  {
    id: 'southern',
    name: '南方密林',
    nameEn: 'Southern Jungle',
    points: '180,320 300,300 380,320 400,380 350,430 240,440 150,410 130,360',
    labelX: 270,
    labelY: 370,
  },
  {
    id: 'western',
    name: '西方砂漠',
    nameEn: 'Western Desert',
    points: '20,180 100,160 140,200 130,270 100,310 50,310 10,270 5,220',
    labelX: 70,
    labelY: 240,
  },
  {
    id: 'maritime',
    name: '海洋共和国',
    nameEn: 'Maritime Republic',
    points: '480,250 550,230 620,250 640,310 600,360 530,370 470,340 460,290',
    labelX: 550,
    labelY: 300,
  },
  {
    id: 'mountain',
    name: '山岳王国',
    nameEn: 'Mountain Kingdom',
    points: '420,120 490,100 550,120 560,180 530,220 470,230 420,210 400,160',
    labelX: 480,
    labelY: 170,
  },
  {
    id: 'frontier',
    name: '辺境地帯',
    nameEn: 'Frontier',
    points: '640,370 720,340 770,370 780,430 740,470 670,470 630,440 620,400',
    labelX: 700,
    labelY: 420,
  },
];

const TRADE_ROUTES: TradeRoute[] = [
  { from: 'northern', to: 'central', x1: 240, y1: 140, x2: 220, y2: 160 },
  { from: 'central', to: 'southern', x1: 260, y1: 290, x2: 270, y2: 300 },
  { from: 'central', to: 'western', x1: 160, y1: 220, x2: 130, y2: 230 },
  { from: 'central', to: 'mountain', x1: 380, y1: 190, x2: 420, y2: 190 },
  { from: 'mountain', to: 'eastern', x1: 550, y1: 130, x2: 580, y2: 130 },
  { from: 'mountain', to: 'maritime', x1: 500, y1: 230, x2: 510, y2: 250 },
  { from: 'maritime', to: 'frontier', x1: 630, y1: 350, x2: 640, y2: 370 },
  { from: 'eastern', to: 'maritime', x1: 660, y1: 200, x2: 620, y2: 250 },
  { from: 'northern', to: 'mountain', x1: 380, y1: 100, x2: 420, y2: 120 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Park-Miller LCG for deterministic AI stats that stay consistent
 * within a turn but vary across years.
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function buildRegions(playerNation: string, year: number): RegionData[] {
  // Seed combines year with arbitrary primes for varied but reproducible results
  const rng = seededRandom(year * 7 + 31);
  // Assign player to a region based on nation name hash
  const playerIndex = Math.abs(playerNation.length * 3 + 7) % BASE_REGIONS.length;

  return BASE_REGIONS.map((base, i) => {
    if (i === playerIndex) {
      return {
        ...base,
        controller: playerNation,
        stance: 'player' as DiplomaticStance,
        gdpFactor: 0.7 + rng() * 0.3,
        militaryFactor: 0.5 + rng() * 0.5,
      };
    }
    const aiIndex = i > playerIndex ? i - 1 : i;
    const stanceIdx = Math.floor(rng() * STANCES.length);
    return {
      ...base,
      controller: AI_NATION_NAMES[aiIndex % AI_NATION_NAMES.length],
      stance: STANCES[stanceIdx],
      gdpFactor: 0.2 + rng() * 0.8,
      militaryFactor: 0.2 + rng() * 0.8,
    };
  });
}

function formatNum(n: number, decimals = 1): string {
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(decimals) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(decimals) + 'K';
  return n.toFixed(decimals);
}

// ── Component ─────────────────────────────────────────────────────────────────

const WorldMap: React.FC<WorldMapProps> = ({
  playerNation,
  era,
  year,
  economic,
  political,
}) => {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const regions = buildRegions(playerNation, year);
  const playerRegion = regions.find((r) => r.stance === 'player');
  const tradePartners = playerRegion
    ? TRADE_ROUTES.filter(
        (tr) => tr.from === playerRegion.id || tr.to === playerRegion.id,
      ).map((tr) => {
        const partnerId = tr.from === playerRegion.id ? tr.to : tr.from;
        return regions.find((r) => r.id === partnerId);
      }).filter(Boolean) as RegionData[]
    : [];

  const hoveredData = hoveredRegion
    ? regions.find((r) => r.id === hoveredRegion) ?? null
    : null;

  const handleMouseMove = (e: React.MouseEvent<SVGElement>) => {
    const svg = e.currentTarget.closest('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>世界地図</span>
        <span style={styles.headerMeta}>
          {ERA_LABELS[era]} — {year}年
        </span>
      </div>

      <div style={styles.mapWrapper}>
        <svg
          viewBox="0 0 800 500"
          style={styles.svg}
          onMouseMove={handleMouseMove}
        >
          {/* Ocean background */}
          <rect x="0" y="0" width="800" height="500" fill="#0a1628" />

          {/* Trade routes */}
          {TRADE_ROUTES.map((tr) => (
            <line
              key={`${tr.from}-${tr.to}`}
              x1={tr.x1}
              y1={tr.y1}
              x2={tr.x2}
              y2={tr.y2}
              stroke="rgba(255,255,255,0.2)"
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
          ))}

          {/* Regions */}
          {regions.map((region) => {
            const isHovered = hoveredRegion === region.id;
            const fillColor = STANCE_COLORS[region.stance];
            return (
              <g key={region.id}>
                <polygon
                  points={region.points}
                  fill={fillColor}
                  fillOpacity={isHovered ? 0.8 : 0.45}
                  stroke={isHovered ? '#fff' : 'rgba(255,255,255,0.3)'}
                  strokeWidth={isHovered ? 2 : 1}
                  style={{ cursor: 'pointer', transition: 'fill-opacity 0.2s, stroke 0.2s' }}
                  onMouseEnter={() => setHoveredRegion(region.id)}
                  onMouseLeave={() => setHoveredRegion(null)}
                />
                <text
                  x={region.labelX}
                  y={region.labelY}
                  textAnchor="middle"
                  fill="#eee"
                  fontSize={11}
                  fontWeight="bold"
                  pointerEvents="none"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}
                >
                  {region.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredData && (
          <div
            style={{
              ...styles.tooltip,
              left: tooltipPos.x + 16,
              top: tooltipPos.y - 10,
            }}
          >
            <div style={styles.tooltipTitle}>{hoveredData.name}</div>
            <div style={styles.tooltipRow}>
              <span style={styles.tooltipLabel}>支配勢力:</span>
              <span>{hoveredData.controller}</span>
            </div>
            <div style={styles.tooltipRow}>
              <span style={styles.tooltipLabel}>外交姿勢:</span>
              <span style={{ color: STANCE_COLORS[hoveredData.stance] }}>
                {STANCE_LABELS[hoveredData.stance]}
              </span>
            </div>
            <div style={styles.tooltipRow}>
              <span style={styles.tooltipLabel}>GDP:</span>
              <div style={styles.barOuter}>
                <div
                  style={{
                    ...styles.barInner,
                    width: `${hoveredData.gdpFactor * 100}%`,
                    background: '#4a9eff',
                  }}
                />
              </div>
            </div>
            <div style={styles.tooltipRow}>
              <span style={styles.tooltipLabel}>軍事力:</span>
              <div style={styles.barOuter}>
                <div
                  style={{
                    ...styles.barInner,
                    width: `${hoveredData.militaryFactor * 100}%`,
                    background: '#e94560',
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={styles.legend}>
        {(Object.keys(STANCE_COLORS) as DiplomaticStance[]).map((stance) => (
          <div key={stance} style={styles.legendItem}>
            <span
              style={{
                ...styles.legendSwatch,
                background: STANCE_COLORS[stance],
              }}
            />
            <span style={styles.legendText}>{STANCE_LABELS[stance]}</span>
          </div>
        ))}
        <div style={styles.legendItem}>
          <svg width={24} height={10}>
            <line
              x1={0}
              y1={5}
              x2={24}
              y2={5}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
          </svg>
          <span style={styles.legendText}>貿易路</span>
        </div>
      </div>

      {/* Player info panel */}
      <div style={styles.infoPanel}>
        <div style={styles.infoPanelSection}>
          <div style={styles.infoTitle}>自国情報</div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>国名:</span>
            <span style={{ color: '#e94560', fontWeight: 'bold' }}>{playerNation}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>支配地域:</span>
            <span>{playerRegion?.name ?? '—'}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>体制:</span>
            <span>{GOVERNMENT_TYPE_LABELS[political.governmentType]}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>GDP:</span>
            <span>{formatNum(economic.gdp)}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>安定度:</span>
            <span>{political.stability.toFixed(0)}%</span>
          </div>
        </div>

        <div style={styles.infoPanelSection}>
          <div style={styles.infoTitle}>貿易相手</div>
          {tradePartners.length === 0 ? (
            <div style={styles.infoRow}>なし</div>
          ) : (
            tradePartners.map((p) => (
              <div key={p.id} style={styles.infoRow}>
                <span
                  style={{
                    ...styles.legendSwatch,
                    background: STANCE_COLORS[p.stance],
                  }}
                />
                <span>{p.controller}</span>
                <span style={{ color: '#aaa', marginLeft: 4 }}>({p.name})</span>
              </div>
            ))
          )}
        </div>

        <div style={styles.infoPanelSection}>
          <div style={styles.infoTitle}>外交概況</div>
          {(['friendly', 'neutral', 'rival', 'hostile'] as DiplomaticStance[]).map(
            (stance) => {
              const count = regions.filter((r) => r.stance === stance).length;
              return (
                <div key={stance} style={styles.infoRow}>
                  <span
                    style={{
                      ...styles.legendSwatch,
                      background: STANCE_COLORS[stance],
                    }}
                  />
                  <span>{STANCE_LABELS[stance]}: {count}国</span>
                </div>
              );
            },
          )}
        </div>
      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#1a1a2e',
    borderRadius: 8,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerMeta: {
    fontSize: 13,
    color: '#aaa',
  },
  mapWrapper: {
    position: 'relative',
    width: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  svg: {
    display: 'block',
    width: '100%',
    height: 'auto',
  },
  tooltip: {
    position: 'absolute',
    background: 'rgba(15,52,96,0.95)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 6,
    padding: '8px 12px',
    color: '#eee',
    fontSize: 12,
    pointerEvents: 'none' as const,
    zIndex: 10,
    minWidth: 160,
    whiteSpace: 'nowrap' as const,
  },
  tooltipTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 6,
    color: '#fff',
    borderBottom: '1px solid rgba(255,255,255,0.15)',
    paddingBottom: 4,
  },
  tooltipRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  tooltipLabel: {
    color: '#aaa',
    minWidth: 60,
  },
  barOuter: {
    flex: 1,
    height: 6,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    minWidth: 60,
  },
  barInner: {
    height: '100%',
    borderRadius: 3,
    transition: 'width 0.3s',
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: 12,
    justifyContent: 'center',
    padding: '6px 0',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  legendSwatch: {
    display: 'inline-block',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: '#ccc',
  },
  infoPanel: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 12,
  },
  infoPanelSection: {
    background: '#0f3460',
    borderRadius: 6,
    padding: 10,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  infoTitle: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#fff',
    marginBottom: 6,
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    paddingBottom: 4,
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: '#eee',
    marginBottom: 3,
  },
  infoLabel: {
    color: '#aaa',
    minWidth: 55,
  },
};

export default WorldMap;
