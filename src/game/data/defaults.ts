import type { EconomicState, PoliticalState } from "../types";
import { GovernmentType } from "../types";

// ── Default Economic State ──────────────────────────────────────────────────

export const DEFAULT_ECONOMIC_STATE: EconomicState = {
  gdp: 1000,
  gdpGrowth: 2.0,
  population: 50,
  populationGrowth: 1.0,
  inflation: 2.0,
  unemployment: 5.0,
  taxRate: 30,
  governmentSpending: {
    defense: 3,          // 対GDP比% (平時先進国: 2-4%)
    education: 5,        // 対GDP比% (OECD平均: 4-6%)
    infrastructure: 4,   // 対GDP比% (先進国: 3-5%)
    welfare: 10,         // 対GDP比% (先進国: 8-20%)
    research: 2,         // 対GDP比% (先進国: 1.5-3%)
  },
  debt: 400,
  debtToGdpRatio: 40,
  tradeBalance: 0,
  giniCoefficient: 0.35,
  treasury: 100,
  fiscalBalance: 0,
  primaryBalance: 0,
  totalSpendingRate: 24,
  totalRevenueRate: 30,
  isWarEconomy: false,
};

// ── Default Political State ─────────────────────────────────────────────────

export const DEFAULT_POLITICAL_STATE: PoliticalState = {
  governmentType: GovernmentType.PARLIAMENTARY_DEMOCRACY,
  legitimacy: 70,
  corruption: 30,
  stability: 60,
  unrest: 20,
  bureaucracyEfficiency: 60,
  electionCycle: 4,
  yearsSinceElection: 0,
};
