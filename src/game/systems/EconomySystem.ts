import type { GameState } from "../types";
import { NewsType } from "../types";
import { WAR_ECONOMY_THRESHOLD } from "../constants";
import { DiplomaticStatus } from "../types";
import { clamp, addNewsItem } from "./helpers";

const NAIRU = 5.0;

export function simulateEconomy(
  state: GameState,
  previousDefenseRate: number,
): void {
  const econ = state.economic;
  const pol = state.political;
  const sp = econ.governmentSpending;

  // ── Fiscal Policy (対GDP比モデル) ──────────────────────────────────
  const totalSpendingRate =
    sp.defense + sp.education + sp.infrastructure + sp.welfare + sp.research;
  const totalRevenueRate = econ.taxRate;

  const taxRevenue = (econ.gdp * totalRevenueRate) / 100;
  const totalSpending = (econ.gdp * totalSpendingRate) / 100;

  // Interest payments: graduated risk premium
  const ratio = econ.debtToGdpRatio;
  let riskPremium: number;
  if (ratio < 60) {
    riskPremium = 0;
  } else if (ratio < 100) {
    riskPremium = (ratio - 60) * 0.0002;
  } else if (ratio < 200) {
    riskPremium = 0.008 + (ratio - 100) * 0.0003;
  } else {
    riskPremium = 0.038 + (ratio - 200) * 0.0005;
  }
  const effectiveInterestRate = 0.02 + riskPremium + Math.max(0, econ.inflation - 2) * 0.003;
  const interestPayment = econ.debt * effectiveInterestRate;

  const primaryBalance = taxRevenue - totalSpending;
  const fiscalBalance = primaryBalance - interestPayment;

  // Update derived fiscal fields
  econ.totalSpendingRate = totalSpendingRate;
  econ.totalRevenueRate = totalRevenueRate;
  econ.primaryBalance = primaryBalance;
  econ.fiscalBalance = fiscalBalance;

  // Apply fiscal balance to treasury/debt
  econ.treasury += fiscalBalance;
  if (econ.treasury < 0) {
    econ.debt += Math.abs(econ.treasury);
    econ.treasury = 0;
  } else if (fiscalBalance > 0) {
    const debtRepayment = Math.min(fiscalBalance * 0.5, econ.debt, econ.treasury);
    econ.treasury -= debtRepayment;
    econ.debt = Math.max(0, econ.debt - debtRepayment);
  }

  // ── War Economy (総力戦経済) ──────────────────────────────────────
  const isWarEconomy = sp.defense > WAR_ECONOMY_THRESHOLD;
  const wasWarEconomy = econ.isWarEconomy;
  econ.isWarEconomy = isWarEconomy;

  let warGrowthBoost = 0;
  let warInflationPush = 0;
  let warUnemploymentReduction = 0;
  let civilianEfficiency = 1.0;

  if (isWarEconomy) {
    const warIntensity = sp.defense - WAR_ECONOMY_THRESHOLD;
    warGrowthBoost = warIntensity * 0.3;
    warInflationPush = warIntensity * 0.8;
    warUnemploymentReduction = warIntensity * 0.8;
    civilianEfficiency = Math.max(0.3, 1.0 - warIntensity * 0.05);

    const hasHostileNeighbor = state.foreignNations.some(
      (n) => n.status === DiplomaticStatus.HOSTILE || n.status === DiplomaticStatus.WAR,
    );
    if (hasHostileNeighbor) {
      pol.legitimacy = clamp(pol.legitimacy + 3, 0, 100);
      pol.unrest = clamp(pol.unrest - 2, 0, 100);
    } else {
      pol.unrest = clamp(pol.unrest + 5, 0, 100);
    }

    if (!wasWarEconomy) {
      addNewsItem(state,
        "【総力戦経済】国防費がGDP比15%を超え、経済は戦時体制に移行しました。工場は軍需品の生産に切り替わり、徴兵が拡大しています。",
        NewsType.ECONOMIC,
      );
    }
  }

  // Demobilization shock
  let demobilizationShock = 0;
  if (wasWarEconomy && !isWarEconomy) {
    const defenseDrop = previousDefenseRate - sp.defense;
    if (defenseDrop > 5) {
      demobilizationShock = defenseDrop * 0.3;
      addNewsItem(state,
        "【軍縮不況】急速な国防費削減により、軍需産業が崩壊し大量の復員兵が労働市場に溢れています。",
        NewsType.ECONOMIC,
      );
    }
  }

  // ── GDP Growth ──────────────────────────────────────────────────────
  const growthSpendingRate = (sp.infrastructure + sp.education + sp.research) * civilianEfficiency;
  const efficiencyBonus = (pol.bureaucracyEfficiency / 100) * (growthSpendingRate / 100) * 15;

  // Keynesian fiscal multiplier
  let fiscalStimulus = 0;
  const deficitRate = -fiscalBalance / Math.max(1, econ.gdp);
  const outputGap = econ.unemployment - NAIRU;

  if (fiscalBalance < 0) {
    if (outputGap > 0) {
      const multiplier = 1.0 + outputGap * 0.05;
      fiscalStimulus = deficitRate * multiplier * 2.0;
    }
  }

  const corruptionDrag = pol.corruption > 30 ? (pol.corruption - 30) * 0.02 : 0;
  const taxDrag = econ.taxRate > 50 ? (econ.taxRate - 50) * 0.03 : 0;
  const debtDrag = econ.debtToGdpRatio > 80 ? (econ.debtToGdpRatio - 80) * 0.005 : 0;
  const meanReversionTarget = 2.0;
  const meanReversion = (meanReversionTarget - econ.gdpGrowth) * 0.15;

  const effectiveGrowth =
    econ.gdpGrowth +
    efficiencyBonus +
    fiscalStimulus +
    warGrowthBoost +
    meanReversion -
    corruptionDrag -
    taxDrag -
    debtDrag -
    demobilizationShock;

  econ.gdp = Math.max(1, econ.gdp * (1 + effectiveGrowth / 100));
  econ.gdpGrowth = clamp(econ.gdpGrowth + meanReversion * 0.5, -20, 30);

  // ── Population ──────────────────────────────────────────────────────
  const welfareEffect = sp.welfare > 8 ? 0.1 : -0.05;
  const prosperityEffect = econ.gdp / Math.max(1, econ.population) > 15 ? -0.1 : 0.05;
  econ.populationGrowth = clamp(
    econ.populationGrowth + welfareEffect + prosperityEffect,
    -2, 5,
  );
  econ.population = Math.max(
    1,
    econ.population * (1 + econ.populationGrowth / 100),
  );

  // ── Inflation (NK Phillips Curve) ────────────────────────────────
  const hasCentralBank = state.institutions.some((i) => i.id === "central_bank" && i.adopted);
  const inflationTarget = 2.0;
  const inflationInertia = econ.inflation * 0.6;
  const demandPull = (effectiveGrowth - 2.0) * 0.3;

  let fiscalInflationPush = 0;
  if (fiscalBalance < 0 && outputGap <= 0) {
    fiscalInflationPush = deficitRate * 3.0;
  } else if (fiscalBalance < 0) {
    fiscalInflationPush = deficitRate * 1.0;
  }

  const centralBankEffect = hasCentralBank ? (econ.inflation - inflationTarget) * 0.2 : 0;

  econ.inflation = clamp(
    inflationInertia + demandPull + fiscalInflationPush + warInflationPush - centralBankEffect + (1 - 0.6) * inflationTarget,
    -5,
    100,
  );

  // ── Unemployment (Okun's Law) ────────────────────────────────────
  const unemploymentChange = -(effectiveGrowth - 2.0) * 0.3;
  const nairuPull = (NAIRU - econ.unemployment) * 0.15;
  econ.unemployment = clamp(
    econ.unemployment + unemploymentChange + nairuPull - warUnemploymentReduction + demobilizationShock * 0.5,
    1,
    50,
  );

  // ── Inequality (Gini) ───────────────────────────────────────────
  const growthInequalityPush = effectiveGrowth > 0 ? effectiveGrowth * 0.002 : 0;
  const redistributionEffect =
    (econ.taxRate > 30 ? 0.002 : 0) +
    (sp.welfare > 12 ? 0.003 : 0);
  const educationEquality = sp.education > 5 ? 0.001 : 0;
  econ.giniCoefficient = clamp(
    econ.giniCoefficient + growthInequalityPush - redistributionEffect - educationEquality,
    0.2,
    0.8,
  );

  // ── Corruption ──────────────────────────────────────────────────
  const adoptedAntiCorruption = state.institutions.filter(
    (i) => i.adopted && i.effects.corruption && i.effects.corruption < 0,
  ).length;
  const corruptionDrift = adoptedAntiCorruption > 0 ? -0.5 : 0.3;
  const spendingCorruption = totalSpendingRate > 45 && pol.bureaucracyEfficiency < 50 ? 0.5 : 0;
  pol.corruption = clamp(pol.corruption + corruptionDrift + spendingCorruption, 0, 100);

  // ── Stability ───────────────────────────────────────────────────
  const stabilityDelta =
    (effectiveGrowth > 2 ? 1 : effectiveGrowth > 0 ? 0.5 : effectiveGrowth > -2 ? -0.5 : -2) +
    (pol.unrest > 70 ? -3 : pol.unrest > 50 ? -1.5 : pol.unrest > 30 ? -0.5 : 0.5) +
    (pol.corruption > 70 ? -1.5 : pol.corruption > 50 ? -0.5 : 0) +
    (econ.unemployment > 20 ? -1.5 : econ.unemployment > 12 ? -0.5 : 0) +
    (econ.inflation > 15 ? -1.5 : econ.inflation > 8 ? -0.5 : 0);
  pol.stability = clamp(pol.stability + stabilityDelta, 0, 100);

  // Unrest dynamics
  const unrestPush =
    (econ.giniCoefficient > 0.5 ? 1 : 0) +
    (econ.unemployment > 10 ? 1 : 0) +
    (econ.inflation > 8 ? 1 : 0);
  const unrestDecay = pol.stability > 50 ? -1.5 : pol.stability > 30 ? -0.5 : 0;
  pol.unrest = clamp(pol.unrest + unrestPush + unrestDecay, 0, 100);

  // ── Update Derived Values ───────────────────────────────────────
  econ.debtToGdpRatio = econ.gdp > 0 ? (econ.debt / econ.gdp) * 100 : 0;

  // Generate fiscal news
  if (fiscalBalance < -econ.gdp * 0.05) {
    addNewsItem(state, "深刻な財政赤字が続いています。", NewsType.ECONOMIC);
  }
  if (econ.inflation > 10) {
    addNewsItem(state, "高インフレが国民生活を圧迫しています。", NewsType.ECONOMIC);
  }
  if (econ.debtToGdpRatio > 100) {
    addNewsItem(state, "国債残高がGDPを超え、財政の持続可能性が懸念されています。", NewsType.ECONOMIC);
  }

  // Round key values
  econ.treasury = Math.round(econ.treasury * 100) / 100;
  econ.gdp = Math.round(econ.gdp * 100) / 100;
  econ.population = Math.round(econ.population * 100) / 100;
  econ.debtToGdpRatio = Math.round(econ.debtToGdpRatio * 100) / 100;
  econ.fiscalBalance = Math.round(econ.fiscalBalance * 100) / 100;
  econ.primaryBalance = Math.round(econ.primaryBalance * 100) / 100;
  econ.giniCoefficient = clamp(
    Math.round(econ.giniCoefficient * 1000) / 1000,
    0,
    1,
  );
}
