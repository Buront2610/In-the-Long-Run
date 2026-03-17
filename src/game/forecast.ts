import type { GameState } from "./types";

// ── Forecast Types ────────────────────────────────────────────────────────────

/** Directional trend for a single indicator. */
export type ForecastTrend = "up" | "down" | "stable";

export interface ForecastItem {
  trend: ForecastTrend;
}

export interface ForecastResult {
  /** GDP成長率の見通し */
  gdp: ForecastItem;
  /** インフレ率の見通し */
  inflation: ForecastItem;
  /** 安定度の見通し */
  stability: ForecastItem;
  /** 失業率の見通し */
  unemployment: ForecastItem;
}

// ── Pure Forecast Function ────────────────────────────────────────────────────

/**
 * Compute a lightweight next-turn forecast from the current game state.
 * Pure function — no side effects.
 */
export function computeForecast(state: GameState): ForecastResult {
  const econ = state.economic;
  const pol = state.political;
  const sp = econ.governmentSpending;

  // ── GDP Growth Forecast ──────────────────────────────────────────────────
  // Productive spending drives growth; corruption and tax drag reduce it
  const prodSpending = sp.infrastructure + sp.education + sp.research;
  const corruptionDrag = pol.corruption > 40 ? (pol.corruption - 40) * 0.015 : 0;
  const taxDrag = econ.taxRate > 50 ? (econ.taxRate - 50) * 0.03 : 0;
  const momentumBonus = econ.gdpGrowth > 2 ? 0.3 : econ.gdpGrowth < 0 ? -0.3 : 0;
  const netGrowthSignal = prodSpending * 0.05 - corruptionDrag - taxDrag + momentumBonus;

  let gdpTrend: ForecastTrend;
  if (netGrowthSignal > 0.5) {
    gdpTrend = "up";
  } else if (netGrowthSignal < -0.3) {
    gdpTrend = "down";
  } else {
    gdpTrend = "stable";
  }

  // ── Inflation Forecast ───────────────────────────────────────────────────
  // Deficit spending into a tight labour market or war economy pushes prices up
  const totalSpendingRate =
    sp.defense + sp.education + sp.infrastructure + sp.welfare + sp.research;
  const hasDeficit = totalSpendingRate > econ.taxRate;
  const inflationary =
    econ.isWarEconomy || (hasDeficit && econ.unemployment < 6);

  let inflationTrend: ForecastTrend;
  if (inflationary || econ.inflation > 8) {
    inflationTrend = "up";
  } else if (econ.inflation < 2 && !hasDeficit) {
    inflationTrend = "down";
  } else {
    inflationTrend = "stable";
  }

  // ── Stability Forecast ───────────────────────────────────────────────────
  // High unrest, unemployment, or inflation weakens stability; growth helps
  const stabilityPressure =
    (pol.unrest > 60 ? -2 : pol.unrest > 40 ? -1 : 0) +
    (econ.unemployment > 15 ? -1 : 0) +
    (econ.inflation > 10 ? -1 : 0) +
    (econ.gdpGrowth > 2 ? 1 : econ.gdpGrowth < 0 ? -1 : 0);

  let stabilityTrend: ForecastTrend;
  if (stabilityPressure >= 1) {
    stabilityTrend = "up";
  } else if (stabilityPressure <= -2) {
    stabilityTrend = "down";
  } else {
    stabilityTrend = "stable";
  }

  // ── Unemployment Forecast ────────────────────────────────────────────────
  // Okun's law: above-trend growth reduces unemployment
  let unemploymentTrend: ForecastTrend;
  if (econ.gdpGrowth > 3) {
    unemploymentTrend = "down";
  } else if (econ.gdpGrowth < 0 || econ.unemployment > 12) {
    unemploymentTrend = "up";
  } else {
    unemploymentTrend = "stable";
  }

  return {
    gdp: { trend: gdpTrend },
    inflation: { trend: inflationTrend },
    stability: { trend: stabilityTrend },
    unemployment: { trend: unemploymentTrend },
  };
}
