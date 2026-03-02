import type {
  GameState,
  Scenario,
  Institution,
  InterestGroup,
  ForeignNation,
  NewsItem,
  HistoryRecord,
} from "./types";
import { NewsType } from "./types";
import {
  DEFAULT_ECONOMIC_STATE,
  DEFAULT_POLITICAL_STATE,
  INITIAL_INSTITUTIONS,
  INITIAL_INTEREST_GROUPS,
  INITIAL_FOREIGN_NATIONS,
  getEraForYear,
} from "./constants";
import { generateRandomEvent } from "./events";
import { getRelevantTips } from "./tips";

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function deepCopyInstitutions(src: Institution[]): Institution[] {
  return src.map((inst) => ({
    ...inst,
    effects: { ...inst.effects },
  }));
}

function deepCopyInterestGroups(src: InterestGroup[]): InterestGroup[] {
  return src.map((ig) => ({
    ...ig,
    demands: [...ig.demands],
  }));
}

function deepCopyForeignNations(src: ForeignNation[]): ForeignNation[] {
  return src.map((fn) => ({ ...fn }));
}

// ── Game Engine ─────────────────────────────────────────────────────────────

export class GameEngine {
  private state: GameState;

  constructor(scenario: Scenario | null = null) {
    const startYear = scenario?.startYear ?? 2000;
    const initialEcon = scenario?.initialState?.economic;
    const initialPol = scenario?.initialState?.political;

    this.state = {
      year: startYear,
      era: getEraForYear(startYear),
      nationName: scenario?.name ?? "プレイヤー国家",
      economic: {
        ...DEFAULT_ECONOMIC_STATE,
        ...(initialEcon ?? {}),
        governmentSpending: {
          ...DEFAULT_ECONOMIC_STATE.governmentSpending,
          ...(initialEcon?.governmentSpending ?? {}),
        },
      },
      political: {
        ...DEFAULT_POLITICAL_STATE,
        ...(initialPol ?? {}),
      },
      institutions: deepCopyInstitutions(INITIAL_INSTITUTIONS),
      interestGroups: deepCopyInterestGroups(INITIAL_INTEREST_GROUPS),
      foreignNations: deepCopyForeignNations(INITIAL_FOREIGN_NATIONS),
      activeEvents: [],
      news: [],
      history: [],
      tips: [],
      scenario: scenario,
      isPaused: false,
      gameOver: false,
    };
  }

  // ── Public API ──────────────────────────────────────────────────────────

  getState(): GameState {
    return this.state;
  }

  nextTurn(): GameState {
    if (this.state.gameOver || this.state.isPaused) {
      return this.state;
    }

    const s = this.state;

    // Phase 1: Record current state
    this.recordHistory();

    // Phase 2: Policy effects already applied via applyPolicy

    // Phase 3: Interest group reactions
    this.updateInterestGroups();

    // Phase 4: Economic simulation
    this.simulateEconomy();

    // Phase 5: Events & results
    s.year += 1;
    s.era = getEraForYear(s.year);

    // Election cycle
    if (s.political.electionCycle > 0) {
      s.political.yearsSinceElection += 1;
      if (s.political.yearsSinceElection >= s.political.electionCycle) {
        s.political.yearsSinceElection = 0;
        s.political.legitimacy = clamp(s.political.legitimacy + 5, 0, 100);
        this.addNewsItem("選挙が実施されました。", NewsType.POLITICAL);
      }
    }

    // Generate random event
    const event = generateRandomEvent(s.year, s);
    if (event) {
      s.activeEvents.push(event);
      this.addNewsItem(`イベント発生: ${event.title}`, NewsType.POLITICAL);
    }

    // Gather relevant tips
    s.tips = getRelevantTips(s);

    // Check game over conditions
    this.checkGameOver();

    return this.state;
  }

  applyPolicy(action: string, value: number): void {
    const s = this.state;

    switch (action) {
      case "tax_rate":
        s.economic.taxRate = clamp(value, 0, 100);
        break;
      case "spending_defense":
        s.economic.governmentSpending.defense = clamp(value, 0, 100);
        break;
      case "spending_education":
        s.economic.governmentSpending.education = clamp(value, 0, 100);
        break;
      case "spending_infrastructure":
        s.economic.governmentSpending.infrastructure = clamp(value, 0, 100);
        break;
      case "spending_welfare":
        s.economic.governmentSpending.welfare = clamp(value, 0, 100);
        break;
      case "spending_research":
        s.economic.governmentSpending.research = clamp(value, 0, 100);
        break;
      case "anti_corruption": {
        const reduction = clamp(value, 0, 20);
        s.political.corruption = clamp(
          s.political.corruption - reduction,
          0,
          100,
        );
        s.political.stability = clamp(s.political.stability - 3, 0, 100);
        s.economic.treasury -= 10;
        this.addNewsItem("反腐敗キャンペーンが実施されました。", NewsType.POLITICAL);
        break;
      }
      case "promote_trade": {
        const boost = clamp(value, 0, 20);
        s.economic.tradeBalance += boost;
        s.economic.gdpGrowth += boost * 0.1;
        s.economic.treasury -= 5;
        this.addNewsItem("貿易促進政策が実施されました。", NewsType.ECONOMIC);
        break;
      }
    }
  }

  adoptInstitution(institutionId: string): boolean {
    const inst = this.state.institutions.find((i) => i.id === institutionId);
    if (!inst || inst.adopted) {
      return false;
    }

    inst.adopted = true;

    // Apply institution effects to state
    for (const [key, value] of Object.entries(inst.effects)) {
      this.applyEffect(key, value);
    }

    this.addNewsItem(
      `制度「${inst.name}」が採用されました。`,
      NewsType.POLITICAL,
    );
    return true;
  }

  handleEventChoice(eventId: string, choiceIndex: number): void {
    const eventIndex = this.state.activeEvents.findIndex(
      (e) => e.id === eventId,
    );
    if (eventIndex === -1) return;

    const event = this.state.activeEvents[eventIndex];
    const choice = event.choices[choiceIndex];
    if (!choice) return;

    // Apply choice effects
    for (const [key, value] of Object.entries(choice.effects)) {
      this.applyEffect(key, value as number);
    }

    this.addNewsItem(
      `${event.title}: ${choice.text}`,
      NewsType.POLITICAL,
    );

    // Remove the event from active events
    this.state.activeEvents.splice(eventIndex, 1);
  }

  updateInterestGroups(): void {
    const s = this.state;

    for (const ig of s.interestGroups) {
      switch (ig.type) {
        case "ARISTOCRACY":
          // Aristocrats prefer low taxes and property rights
          ig.satisfaction = clamp(
            ig.satisfaction + (s.economic.taxRate < 25 ? 2 : -2),
            0,
            100,
          );
          break;
        case "MILITARY":
          // Military wants high defense spending
          ig.satisfaction = clamp(
            ig.satisfaction +
              (s.economic.governmentSpending.defense > 20 ? 2 : -2),
            0,
            100,
          );
          break;
        case "MERCHANTS":
          // Merchants prefer free trade and low regulation
          ig.satisfaction = clamp(
            ig.satisfaction + (s.economic.tradeBalance > 0 ? 2 : -1),
            0,
            100,
          );
          break;
        case "WORKERS":
          // Workers want welfare spending and low unemployment
          ig.satisfaction = clamp(
            ig.satisfaction +
              (s.economic.governmentSpending.welfare > 25 ? 2 : -2) +
              (s.economic.unemployment < 8 ? 1 : -1),
            0,
            100,
          );
          break;
        case "FARMERS":
          // Farmers prefer subsidies (welfare) and stable prices
          ig.satisfaction = clamp(
            ig.satisfaction + (s.economic.inflation < 5 ? 1 : -2),
            0,
            100,
          );
          break;
        case "INTELLECTUALS":
          // Intellectuals want education and research spending
          ig.satisfaction = clamp(
            ig.satisfaction +
              (s.economic.governmentSpending.education +
                s.economic.governmentSpending.research >
              30
                ? 2
                : -2),
            0,
            100,
          );
          break;
        case "BUREAUCRATS":
          // Bureaucrats want budget growth and stability
          ig.satisfaction = clamp(
            ig.satisfaction + (s.political.stability > 50 ? 1 : -1),
            0,
            100,
          );
          break;
      }

      // Low satisfaction increases unrest
      if (ig.satisfaction < 30) {
        s.political.unrest = clamp(
          s.political.unrest + ig.influence * 0.1,
          0,
          100,
        );
      }
    }
  }

  addNewsItem(text: string, type: NewsType): void {
    const item: NewsItem = {
      text,
      year: this.state.year,
      type,
    };
    this.state.news.unshift(item);
    // Keep only last 50 news items
    if (this.state.news.length > 50) {
      this.state.news.length = 50;
    }
  }

  // ── Private Helpers ───────────────────────────────────────────────────

  private simulateEconomy(): void {
    const s = this.state;
    const econ = s.economic;
    const pol = s.political;

    // ── Fiscal Policy ───────────────────────────────────────────────────
    // Tax revenue
    const taxRevenue = (econ.gdp * econ.taxRate) / 100;

    // Spending categories are % of the government budget (tax revenue)
    const sp = econ.governmentSpending;
    const totalSpendingPct =
      sp.defense + sp.education + sp.infrastructure + sp.welfare + sp.research;
    const totalSpending = (taxRevenue * totalSpendingPct) / 100;

    // Interest payments on outstanding debt (effective rate: 2-8% depending on risk)
    const riskPremium = econ.debtToGdpRatio > 100 ? 0.03 : econ.debtToGdpRatio > 60 ? 0.01 : 0;
    const effectiveInterestRate = 0.02 + riskPremium + Math.max(0, econ.inflation - 2) * 0.005;
    const interestPayment = econ.debt * effectiveInterestRate;

    // Budget balance (after interest)
    const budgetBalance = taxRevenue - totalSpending - interestPayment;
    econ.treasury += budgetBalance;
    if (econ.treasury < 0) {
      // Shortfall covered by borrowing
      econ.debt += Math.abs(econ.treasury);
      econ.treasury = 0;
    } else if (budgetBalance > 0) {
      // Surplus can pay down debt
      const debtRepayment = Math.min(budgetBalance * 0.5, econ.debt);
      econ.debt = Math.max(0, econ.debt - debtRepayment);
    }

    // ── GDP Growth ──────────────────────────────────────────────────────
    // Spending efficiency bonus: actual spending amounts relative to GDP drive growth
    const actualInfraSpend = (taxRevenue * sp.infrastructure) / 100;
    const actualEduSpend = (taxRevenue * sp.education) / 100;
    const actualResearchSpend = (taxRevenue * sp.research) / 100;
    const spendingToGdpRatio = (actualInfraSpend + actualEduSpend + actualResearchSpend) / Math.max(1, econ.gdp);
    const efficiencyBonus =
      (pol.bureaucracyEfficiency / 100) * spendingToGdpRatio * 15;

    // High corruption reduces growth efficiency
    const corruptionDrag = pol.corruption > 30 ? (pol.corruption - 30) * 0.02 : 0;

    // High tax rates create diminishing returns (Laffer curve effect)
    const taxDrag = econ.taxRate > 50 ? (econ.taxRate - 50) * 0.03 : 0;

    // High debt-to-GDP creates drag on growth
    const debtDrag = econ.debtToGdpRatio > 80 ? (econ.debtToGdpRatio - 80) * 0.01 : 0;

    // Mean reversion: extreme growth rates naturally moderate
    const meanReversionTarget = 2.0;
    const meanReversion = (meanReversionTarget - econ.gdpGrowth) * 0.1;

    const effectiveGrowth = econ.gdpGrowth + efficiencyBonus + meanReversion - corruptionDrag - taxDrag - debtDrag;
    econ.gdp = Math.max(1, econ.gdp * (1 + effectiveGrowth / 100));

    // Update base GDP growth rate with natural drift
    econ.gdpGrowth = clamp(econ.gdpGrowth + meanReversion * 0.5, -20, 30);

    // ── Population ──────────────────────────────────────────────────────
    // Population growth responds to economic conditions
    const welfareEffect = (sp.welfare > 20 ? 0.1 : -0.05);
    const prosperityEffect = econ.gdp / Math.max(1, econ.population) > 15 ? -0.1 : 0.05; // demographic transition
    econ.populationGrowth = clamp(
      econ.populationGrowth + welfareEffect + prosperityEffect,
      -2, 5,
    );
    econ.population = Math.max(
      1,
      econ.population * (1 + econ.populationGrowth / 100),
    );

    // ── Inflation (NK Phillips Curve-inspired) ──────────────────────────
    // π_t ≈ inertia + demand_pull + fiscal_push - central_bank_stabilization
    const hasCentralBank = s.institutions.some((i) => i.id === "central_bank" && i.adopted);
    const inflationTarget = 2.0;
    const inflationInertia = econ.inflation * 0.6;
    const demandPull = (effectiveGrowth - 2.0) * 0.3;
    const fiscalPush = budgetBalance < 0 ? Math.abs(budgetBalance / Math.max(1, econ.gdp)) * 8 : 0;
    const centralBankEffect = hasCentralBank ? (econ.inflation - inflationTarget) * 0.2 : 0;

    econ.inflation = clamp(
      inflationInertia + demandPull + fiscalPush - centralBankEffect + (1 - 0.6) * inflationTarget,
      -5,
      100,
    );

    // ── Unemployment (Okun's Law with NAIRU) ────────────────────────────
    const nairu = 5.0;
    // Okun's law: 1% above-trend growth reduces unemployment by ~0.3%
    const unemploymentChange = -(effectiveGrowth - 2.0) * 0.3;
    // Natural tendency toward NAIRU (stronger pull to prevent 0% unemployment)
    const nairuPull = (nairu - econ.unemployment) * 0.15;
    econ.unemployment = clamp(econ.unemployment + unemploymentChange + nairuPull, 1, 50);

    // ── Inequality (Gini Coefficient) ───────────────────────────────────
    // Growth without redistribution increases inequality
    const growthInequalityPush = effectiveGrowth > 0 ? effectiveGrowth * 0.002 : 0;
    // Progressive taxation and welfare reduce inequality
    const redistributionEffect = (econ.taxRate > 30 ? 0.002 : 0) + (sp.welfare > 25 ? 0.003 : 0);
    // Education reduces long-term inequality
    const educationEquality = sp.education > 20 ? 0.001 : 0;
    econ.giniCoefficient = clamp(
      econ.giniCoefficient + growthInequalityPush - redistributionEffect - educationEquality,
      0.2,
      0.8,
    );

    // ── Corruption ──────────────────────────────────────────────────────
    const adoptedAntiCorruption = s.institutions.filter(
      (i) => i.adopted && i.effects.corruption && i.effects.corruption < 0,
    ).length;
    const corruptionDrift = adoptedAntiCorruption > 0 ? -0.5 : 0.3;
    // High spending with low transparency breeds corruption
    const spendingCorruption = totalSpendingPct > 90 && pol.bureaucracyEfficiency < 50 ? 0.5 : 0;
    pol.corruption = clamp(pol.corruption + corruptionDrift + spendingCorruption, 0, 100);

    // ── Stability ───────────────────────────────────────────────────────
    const stabilityDelta =
      (effectiveGrowth > 2 ? 1 : effectiveGrowth > 0 ? 0.5 : effectiveGrowth > -2 ? -0.5 : -2) +
      (pol.unrest > 70 ? -3 : pol.unrest > 50 ? -1.5 : pol.unrest > 30 ? -0.5 : 0.5) +
      (pol.corruption > 70 ? -1.5 : pol.corruption > 50 ? -0.5 : 0) +
      (econ.unemployment > 20 ? -1.5 : econ.unemployment > 12 ? -0.5 : 0) +
      (econ.inflation > 15 ? -1.5 : econ.inflation > 8 ? -0.5 : 0);
    pol.stability = clamp(pol.stability + stabilityDelta, 0, 100);

    // Unrest dynamics: high inequality and unemployment fuel unrest
    const unrestPush =
      (econ.giniCoefficient > 0.5 ? 1 : 0) +
      (econ.unemployment > 10 ? 1 : 0) +
      (econ.inflation > 8 ? 1 : 0);
    const unrestDecay = pol.stability > 50 ? -1.5 : pol.stability > 30 ? -0.5 : 0;
    pol.unrest = clamp(pol.unrest + unrestPush + unrestDecay, 0, 100);

    // ── Update Derived Values ───────────────────────────────────────────
    econ.debtToGdpRatio = econ.gdp > 0 ? (econ.debt / econ.gdp) * 100 : 0;

    // Generate fiscal news
    if (budgetBalance < -econ.gdp * 0.05) {
      this.addNewsItem("深刻な財政赤字が続いています。", NewsType.ECONOMIC);
    }
    if (econ.inflation > 10) {
      this.addNewsItem("高インフレが国民生活を圧迫しています。", NewsType.ECONOMIC);
    }
    if (econ.debtToGdpRatio > 100) {
      this.addNewsItem("国債残高がGDPを超え、財政の持続可能性が懸念されています。", NewsType.ECONOMIC);
    }

    // Clamp & round key values
    econ.treasury = Math.round(econ.treasury * 100) / 100;
    econ.gdp = Math.round(econ.gdp * 100) / 100;
    econ.population = Math.round(econ.population * 100) / 100;
    econ.debtToGdpRatio = Math.round(econ.debtToGdpRatio * 100) / 100;
    econ.giniCoefficient = clamp(
      Math.round(econ.giniCoefficient * 1000) / 1000,
      0,
      1,
    );
  }

  private applyEffect(key: string, delta: number): void {
    const econ = this.state.economic;
    const pol = this.state.political;

    switch (key) {
      // Economic effects
      case "gdp":
        econ.gdp = Math.max(1, econ.gdp + delta);
        break;
      case "gdpGrowth":
        econ.gdpGrowth = clamp(econ.gdpGrowth + delta, -20, 30);
        break;
      case "population":
        econ.population = Math.max(1, econ.population + delta);
        break;
      case "populationGrowth":
        econ.populationGrowth = clamp(econ.populationGrowth + delta, -5, 10);
        break;
      case "inflation":
        econ.inflation = clamp(econ.inflation + delta, -5, 100);
        break;
      case "unemployment":
        econ.unemployment = clamp(econ.unemployment + delta, 0, 50);
        break;
      case "taxRate":
        econ.taxRate = clamp(econ.taxRate + delta, 0, 100);
        break;
      case "debt":
        econ.debt = Math.max(0, econ.debt + delta);
        break;
      case "debtToGdpRatio":
        econ.debtToGdpRatio = Math.max(0, econ.debtToGdpRatio + delta);
        break;
      case "tradeBalance":
        econ.tradeBalance += delta;
        break;
      case "giniCoefficient":
        econ.giniCoefficient = clamp(econ.giniCoefficient + delta, 0, 1);
        break;
      case "treasury":
        econ.treasury += delta;
        break;
      // Political effects
      case "legitimacy":
        pol.legitimacy = clamp(pol.legitimacy + delta, 0, 100);
        break;
      case "corruption":
        pol.corruption = clamp(pol.corruption + delta, 0, 100);
        break;
      case "stability":
        pol.stability = clamp(pol.stability + delta, 0, 100);
        break;
      case "unrest":
        pol.unrest = clamp(pol.unrest + delta, 0, 100);
        break;
      case "bureaucracyEfficiency":
        pol.bureaucracyEfficiency = clamp(
          pol.bureaucracyEfficiency + delta,
          0,
          100,
        );
        break;
    }
  }

  private recordHistory(): void {
    const s = this.state;
    const record: HistoryRecord = {
      year: s.year,
      gdp: s.economic.gdp,
      population: s.economic.population,
      inflation: s.economic.inflation,
      unemployment: s.economic.unemployment,
      stability: s.political.stability,
      corruption: s.political.corruption,
    };
    s.history.push(record);
  }

  private checkGameOver(): void {
    const s = this.state;

    if (s.political.stability < 5) {
      s.gameOver = true;
      this.addNewsItem(
        "国家の安定が完全に崩壊しました。ゲームオーバー。",
        NewsType.POLITICAL,
      );
    } else if (s.economic.debtToGdpRatio > 300) {
      s.gameOver = true;
      this.addNewsItem(
        "国家が財政破綻しました。ゲームオーバー。",
        NewsType.ECONOMIC,
      );
    } else if (s.political.unrest > 95) {
      s.gameOver = true;
      this.addNewsItem(
        "全国的な反乱が発生し、政権が崩壊しました。ゲームオーバー。",
        NewsType.POLITICAL,
      );
    } else if (s.economic.inflation > 50) {
      s.gameOver = true;
      this.addNewsItem(
        "ハイパーインフレーションにより経済が崩壊しました。ゲームオーバー。",
        NewsType.ECONOMIC,
      );
    }
  }
}
