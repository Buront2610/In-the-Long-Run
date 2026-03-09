import React from 'react';
import type { EconomicState } from '../game/types';
import { WAR_ECONOMY_THRESHOLD } from '../game/constants';
import {
  SLIDER_POLICIES,
  ACTION_POLICIES,
  SPENDING_KEYS,
  spendingFieldKey,
  type SpendingPolicyKey,
} from '../game/policies';

interface PolicyPanelProps {
  economic: EconomicState;
  actionsUsedThisTurn: string[];
  onApplyPolicy: (action: string, value: number) => void;
}

function formatNum(n: number, decimals = 0): string {
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toFixed(decimals);
}

const PolicyPanel: React.FC<PolicyPanelProps> = ({ economic, actionsUsedThisTurn, onApplyPolicy }) => {
  const sp = economic.governmentSpending;
  const totalSpendingRate = sp.defense + sp.education + sp.infrastructure + sp.welfare + sp.research;
  const revenue = (economic.taxRate / 100) * economic.gdp;
  const spending = (totalSpendingRate / 100) * economic.gdp;
  const interestPayment = economic.primaryBalance - economic.fiscalBalance;
  const fiscalBalance = economic.fiscalBalance;
  const isDeficit = fiscalBalance < 0;

  const actionEntries = Object.entries(ACTION_POLICIES) as [string, typeof ACTION_POLICIES[keyof typeof ACTION_POLICIES]][];

  // Revenue vs spending bar widths (relative to max of 60%)
  const barMax = 60;
  const revBarPct = Math.min((economic.taxRate / barMax) * 100, 100);
  const spendBarPct = Math.min((totalSpendingRate / barMax) * 100, 100);

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>財政政策</h3>

      {/* ── Fiscal Summary ── */}
      <div style={styles.summaryBox}>
        <div style={styles.summaryRow}>
          <span style={styles.summaryLabel}>歳入</span>
          <span style={styles.summaryValue}>
            {formatNum(revenue)} <span style={styles.summaryPct}>(GDP比 {economic.taxRate}%)</span>
          </span>
        </div>
        <div style={styles.summaryRow}>
          <span style={styles.summaryLabel}>歳出</span>
          <span style={styles.summaryValue}>
            {formatNum(spending)} <span style={styles.summaryPct}>(GDP比 {totalSpendingRate.toFixed(1)}%)</span>
          </span>
        </div>
        <div style={styles.summaryRow}>
          <span style={styles.summaryLabel}>利払い</span>
          <span style={styles.summaryValue}>{formatNum(interestPayment)}</span>
        </div>
        <div style={{ ...styles.summaryRow, ...styles.summaryTotal }}>
          <span style={styles.summaryLabel}>財政収支</span>
          <span style={{
            ...styles.summaryValue,
            color: isDeficit ? '#e94560' : '#53d769',
            fontWeight: 'bold',
          }}>
            {isDeficit ? '' : '+'}{formatNum(fiscalBalance)}
            <span style={{ ...styles.summaryPct, color: isDeficit ? '#e94560' : '#53d769' }}>
              {' '}({isDeficit ? '赤字' : '黒字'})
            </span>
          </span>
        </div>
        <div style={styles.summaryRow}>
          <span style={styles.summaryLabel}>国家債務</span>
          <span style={styles.summaryValue}>
            {formatNum(economic.debt)} <span style={styles.summaryPct}>(対GDP {economic.debtToGdpRatio.toFixed(0)}%)</span>
          </span>
        </div>
      </div>

      <div style={styles.divider} />

      {/* ── Tax Rate ── */}
      <div style={styles.section}>
        <div style={styles.sliderHeader}>
          <span style={styles.label}>{SLIDER_POLICIES.tax_rate.label}</span>
          <span style={styles.value}>{economic.taxRate}%</span>
        </div>
        <input
          type="range"
          min={SLIDER_POLICIES.tax_rate.min}
          max={SLIDER_POLICIES.tax_rate.max}
          step={SLIDER_POLICIES.tax_rate.step}
          value={economic.taxRate}
          onChange={(e) => onApplyPolicy('tax_rate', Number(e.target.value))}
          style={styles.slider}
        />
        <div style={styles.descText}>
          税率は歳入の源泉。高すぎるとラッファー曲線により成長率が低下。50%超は特に深刻。低すぎると歳入不足に。
        </div>
      </div>

      <div style={styles.divider} />

      {/* ── Spending Categories ── */}
      <div style={styles.sectionHeader}>
        <span style={styles.label}>歳出配分 (対GDP比)</span>
        <span style={{
          ...styles.totalBadge,
          color: totalSpendingRate > economic.taxRate ? '#e94560'
            : totalSpendingRate > economic.taxRate * 0.9 ? '#ffcc00'
            : '#53d769',
        }}>
          合計: {totalSpendingRate.toFixed(1)}%
        </span>
      </div>

      {SPENDING_KEYS.map((policyKey) => {
        const def = SLIDER_POLICIES[policyKey];
        const fieldKey = spendingFieldKey(policyKey as SpendingPolicyKey);
        const val = sp[fieldKey];
        const actualAmount = (val / 100) * economic.gdp;
        return (
          <div key={policyKey} style={styles.section}>
            <div style={styles.sliderHeader}>
              <span style={styles.label}>{def.label}</span>
              <span style={styles.value}>
                {val.toFixed(1)}%
                <span style={styles.actualAmount}> ({formatNum(actualAmount)})</span>
              </span>
            </div>
            <input
              type="range"
              min={def.min}
              max={def.max}
              step={def.step}
              value={val}
              onChange={(e) => onApplyPolicy(policyKey, Number(e.target.value))}
              style={styles.slider}
            />
            <div style={styles.descText}>{def.desc}</div>
          </div>
        );
      })}

      {/* ── Revenue vs Spending Visual Bar ── */}
      <div style={styles.barSection}>
        <div style={styles.barRow}>
          <span style={styles.barLabel}>歳入 {economic.taxRate}%</span>
          <div style={styles.barTrack}>
            <div style={{ ...styles.barFill, width: `${revBarPct}%`, background: '#53d769' }} />
          </div>
        </div>
        <div style={styles.barRow}>
          <span style={styles.barLabel}>歳出 {totalSpendingRate.toFixed(1)}%</span>
          <div style={styles.barTrack}>
            <div style={{
              ...styles.barFill,
              width: `${spendBarPct}%`,
              background: totalSpendingRate > economic.taxRate ? '#e94560' : '#4fc3f7',
            }} />
          </div>
        </div>
        {!isDeficit && (
          <div style={styles.surplusNote}>
            財政余裕: +{((fiscalBalance / economic.gdp) * 100).toFixed(1)}% of GDP
          </div>
        )}
        {isDeficit && (
          <div style={styles.deficitNote}>
            財政赤字: {((fiscalBalance / economic.gdp) * 100).toFixed(1)}% of GDP
          </div>
        )}
      </div>

      {/* ── War Economy Warning ── */}
      {sp.defense > WAR_ECONOMY_THRESHOLD && (
        <div style={styles.warWarning}>
          総力戦経済モード: 国防費GDP比{sp.defense.toFixed(1)}% (閾値: {WAR_ECONOMY_THRESHOLD}%)
          <br />
          <span style={styles.warDetail}>
            失業率低下・軍需ブースト・高インフレ・民間効率低下
          </span>
        </div>
      )}
      {sp.defense >= 10 && sp.defense < WAR_ECONOMY_THRESHOLD && (
        <div style={styles.warCaution}>
          国防費GDP比{sp.defense.toFixed(1)}% — {WAR_ECONOMY_THRESHOLD}%超で総力戦経済に突入
        </div>
      )}

      <div style={styles.divider} />

      {/* ── Special Actions ── */}
      <div style={styles.actionsHeader}>
        <span style={styles.label}>特殊アクション</span>
        <span style={styles.actionNote}>ターン内1回のみ</span>
      </div>
      <div style={styles.actions}>
        {actionEntries.map(([key, def]) => {
          const used = actionsUsedThisTurn.includes(key);
          return (
            <button
              key={key}
              style={{
                ...styles.actionButton,
                ...(used ? styles.actionButtonDisabled : {}),
              }}
              disabled={used}
              onClick={() => onApplyPolicy(key, def.cost)}
            >
              {def.label}
              {used && <span style={styles.usedBadge}> (実施済)</span>}
            </button>
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
  summaryBox: {
    background: 'rgba(0,0,0,0.2)',
    borderRadius: 6,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 13,
  },
  summaryTotal: {
    borderTop: '1px solid rgba(255,255,255,0.15)',
    paddingTop: 6,
    marginTop: 2,
  },
  summaryLabel: {
    color: '#aaa',
  },
  summaryValue: {
    color: '#eee',
    fontFamily: 'monospace',
  },
  summaryPct: {
    color: '#888',
    fontSize: 11,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  label: {
    fontSize: 13,
    color: '#ccc',
  },
  value: {
    fontSize: 13,
    color: '#ffcc00',
    fontWeight: 'bold',
  },
  actualAmount: {
    fontSize: 11,
    color: '#888',
    fontWeight: 'normal',
  },
  totalBadge: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    accentColor: '#e94560',
    cursor: 'pointer',
  },
  divider: {
    borderTop: '1px solid rgba(255,255,255,0.1)',
    margin: '12px 0',
  },
  barSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  barRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 11,
    color: '#aaa',
    minWidth: 80,
    textAlign: 'right' as const,
  },
  barTrack: {
    flex: 1,
    height: 10,
    background: 'rgba(255,255,255,0.08)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
    transition: 'width 0.2s ease',
  },
  surplusNote: {
    fontSize: 11,
    color: '#53d769',
    textAlign: 'center' as const,
    marginTop: 4,
  },
  deficitNote: {
    fontSize: 11,
    color: '#e94560',
    textAlign: 'center' as const,
    marginTop: 4,
  },
  warWarning: {
    background: 'rgba(233,69,96,0.2)',
    border: '1px solid #e94560',
    borderRadius: 6,
    padding: '8px 12px',
    fontSize: 12,
    color: '#e94560',
    fontWeight: 'bold',
    marginTop: 8,
  },
  warDetail: {
    fontWeight: 'normal',
    fontSize: 11,
    color: '#ccc',
  },
  warCaution: {
    background: 'rgba(255,204,0,0.1)',
    border: '1px solid rgba(255,204,0,0.3)',
    borderRadius: 6,
    padding: '6px 10px',
    fontSize: 11,
    color: '#ffcc00',
    marginTop: 8,
  },
  actionsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionNote: {
    fontSize: 11,
    color: '#888',
  },
  actions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  actionButton: {
    flex: 1,
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 'bold',
    background: '#1a1a2e',
    color: '#eee',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 6,
    cursor: 'pointer',
  },
  actionButtonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  usedBadge: {
    fontSize: 10,
    fontWeight: 'normal',
    color: '#888',
  },
  descText: {
    fontSize: 10,
    color: '#777',
    marginBottom: 6,
    lineHeight: 1.3,
    paddingLeft: 2,
  },
};

export default PolicyPanel;
