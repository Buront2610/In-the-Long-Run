import type {
  GameState,
  Scenario,
  Institution,
  InterestGroup,
  ForeignNation,
  NewsItem,
  HistoryRecord,
} from "./types";
import { GovernmentType, NewsType, DiplomaticStatus } from "./types";
import {
  DEFAULT_ECONOMIC_STATE,
  DEFAULT_POLITICAL_STATE,
  INITIAL_INSTITUTIONS,
  INITIAL_INTEREST_GROUPS,
  INITIAL_FOREIGN_NATIONS,
  GOVERNMENT_TYPE_LABELS,
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

    // Phase 4.5: Diplomatic simulation
    this.simulateDiplomacy();

    // Phase 5: Events & results
    s.year += 1;
    s.era = getEraForYear(s.year);

    // Election cycle
    if (s.political.electionCycle > 0) {
      s.political.yearsSinceElection += 1;
      if (s.political.yearsSinceElection >= s.political.electionCycle) {
        s.political.yearsSinceElection = 0;
        // Election outcome depends on economic and political conditions
        const approvalBonus = s.economic.gdpGrowth > 2 ? 3 : s.economic.gdpGrowth > 0 ? 1 : -5;
        const unrestPenalty = s.political.unrest > 50 ? -5 : s.political.unrest > 30 ? -2 : 0;
        s.political.legitimacy = clamp(
          s.political.legitimacy + 5 + approvalBonus + unrestPenalty,
          0,
          100,
        );
        if (s.economic.gdpGrowth > 2 && s.political.unrest < 30) {
          this.addNewsItem("選挙が実施され、現政権が信任を得ました。好調な経済が支持率を押し上げています。", NewsType.POLITICAL);
        } else if (s.political.unrest > 50 || s.economic.gdpGrowth < 0) {
          this.addNewsItem("選挙が実施されました。不満を持つ有権者の投票行動が政治地図を塗り替えつつあります。", NewsType.POLITICAL);
        } else {
          this.addNewsItem("選挙が実施されました。国民は政権に対して慎重な判断を下しました。", NewsType.POLITICAL);
        }
      }
    }

    // Government type transition check
    this.checkGovernmentTransition();

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
    const s = this.state;
    const inst = s.institutions.find((i) => i.id === institutionId);
    if (!inst || inst.adopted) {
      return false;
    }

    // Check prerequisites
    for (const preId of inst.prerequisiteIds) {
      const pre = s.institutions.find((i) => i.id === preId);
      if (!pre || !pre.adopted) {
        this.addNewsItem(
          `制度「${inst.name}」の前提条件が満たされていません。`,
          NewsType.POLITICAL,
        );
        return false;
      }
    }

    // Check treasury
    if (s.economic.treasury < inst.adoptionCost) {
      this.addNewsItem(
        `制度「${inst.name}」を採用するための財源（${inst.adoptionCost}）が不足しています。`,
        NewsType.ECONOMIC,
      );
      return false;
    }

    // Pay adoption cost
    s.economic.treasury -= inst.adoptionCost;

    // Apply stability impact (transition cost)
    s.political.stability = clamp(
      s.political.stability + inst.stabilityImpact,
      0,
      100,
    );

    inst.adopted = true;

    // Apply institution effects to state
    for (const [key, value] of Object.entries(inst.effects)) {
      this.applyEffect(key, value);
    }

    this.addNewsItem(
      `制度「${inst.name}」が採用されました。（費用: ${inst.adoptionCost}、安定度変化: ${inst.stabilityImpact}）`,
      NewsType.POLITICAL,
    );
    return true;
  }

  revokeInstitution(institutionId: string): boolean {
    const s = this.state;
    const inst = s.institutions.find((i) => i.id === institutionId);
    if (!inst || !inst.adopted || !inst.revocable) {
      return false;
    }

    // Check if any other adopted institution depends on this one
    const dependents = s.institutions.filter(
      (i) => i.adopted && i.prerequisiteIds.includes(institutionId),
    );
    if (dependents.length > 0) {
      const names = dependents.map((d) => d.name).join("、");
      this.addNewsItem(
        `制度「${inst.name}」は他の制度（${names}）の前提条件のため廃止できません。`,
        NewsType.POLITICAL,
      );
      return false;
    }

    inst.adopted = false;

    // Reverse institution effects
    for (const [key, value] of Object.entries(inst.effects)) {
      this.applyEffect(key, -value);
    }

    // Revoking causes instability and unrest
    s.political.stability = clamp(s.political.stability - 5, 0, 100);
    s.political.unrest = clamp(s.political.unrest + 5, 0, 100);

    this.addNewsItem(
      `制度「${inst.name}」が廃止されました。社会に動揺が広がっています。`,
      NewsType.POLITICAL,
    );
    return true;
  }

  // ── Diplomatic Actions ──────────────────────────────────────────────

  performDiplomaticAction(nationId: string, action: string): boolean {
    const s = this.state;
    const nation = s.foreignNations.find((n) => n.id === nationId);
    if (!nation) return false;

    switch (action) {
      case "improve_relations": {
        if (s.economic.treasury < 10) {
          this.addNewsItem("外交活動のための資金が不足しています。", NewsType.DIPLOMATIC);
          return false;
        }
        s.economic.treasury -= 10;
        nation.opinion = clamp(nation.opinion + 15, -100, 100);
        this.updateDiplomaticStatus(nation);
        this.addNewsItem(
          `${nation.name}との外交関係改善に向けた使節団を派遣しました。関係が改善しつつあります。`,
          NewsType.DIPLOMATIC,
        );
        return true;
      }
      case "trade_agreement": {
        if (nation.tradeAgreement) return false;
        if (nation.opinion < -10) {
          this.addNewsItem(
            `${nation.name}との関係が悪すぎるため、貿易協定の締結は拒否されました。`,
            NewsType.DIPLOMATIC,
          );
          return false;
        }
        if (s.economic.treasury < 15) {
          this.addNewsItem("貿易協定締結のための資金が不足しています。", NewsType.DIPLOMATIC);
          return false;
        }
        s.economic.treasury -= 15;
        nation.tradeAgreement = true;
        nation.opinion = clamp(nation.opinion + 10, -100, 100);
        s.economic.tradeBalance += 3;
        s.economic.gdpGrowth += 0.2;
        this.updateDiplomaticStatus(nation);
        this.addNewsItem(
          `${nation.name}との貿易協定が締結されました。両国の交易が活発化します。`,
          NewsType.DIPLOMATIC,
        );
        return true;
      }
      case "form_alliance": {
        if (nation.alliance) return false;
        if (nation.opinion < 30) {
          this.addNewsItem(
            `${nation.name}との関係が十分でないため、同盟の提案は拒否されました。`,
            NewsType.DIPLOMATIC,
          );
          return false;
        }
        if (s.economic.treasury < 25) {
          this.addNewsItem("同盟締結のための資金が不足しています。", NewsType.DIPLOMATIC);
          return false;
        }
        s.economic.treasury -= 25;
        nation.alliance = true;
        nation.opinion = clamp(nation.opinion + 20, -100, 100);
        nation.status = DiplomaticStatus.ALLIANCE;
        s.political.stability = clamp(s.political.stability + 3, 0, 100);
        this.addNewsItem(
          `${nation.name}と正式な同盟を締結しました。両国の安全保障が強化されます。`,
          NewsType.DIPLOMATIC,
        );
        return true;
      }
      case "denounce": {
        nation.opinion = clamp(nation.opinion - 25, -100, 100);
        this.updateDiplomaticStatus(nation);
        s.political.legitimacy = clamp(s.political.legitimacy + 2, 0, 100);
        // Other nations notice
        for (const other of s.foreignNations) {
          if (other.id !== nationId) {
            if (other.opinion < 0) {
              // Enemies of our enemy become friendlier
              other.opinion = clamp(other.opinion + 5, -100, 100);
            }
          }
        }
        this.addNewsItem(
          `${nation.name}の行為を公式に非難しました。国際社会に波紋が広がっています。`,
          NewsType.DIPLOMATIC,
        );
        return true;
      }
      case "economic_sanctions": {
        if (nation.opinion > 20) {
          this.addNewsItem(
            `${nation.name}との関係が良好なため、経済制裁は適切ではありません。`,
            NewsType.DIPLOMATIC,
          );
          return false;
        }
        nation.opinion = clamp(nation.opinion - 20, -100, 100);
        nation.tradeAgreement = false;
        nation.alliance = false;
        this.updateDiplomaticStatus(nation);
        s.economic.tradeBalance -= 2;
        this.addNewsItem(
          `${nation.name}に対する経済制裁を発動しました。通商関係が断絶されます。`,
          NewsType.DIPLOMATIC,
        );
        return true;
      }
      default:
        return false;
    }
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

  private checkGovernmentTransition(): void {
    const s = this.state;
    const pol = s.political;
    const gt = pol.governmentType;

    // Revolution: extreme unrest can overthrow the government
    if (pol.unrest > 80 && pol.stability < 20 && Math.random() < 0.3) {
      if (gt === GovernmentType.ABSOLUTE_MONARCHY || gt === GovernmentType.MONARCHY || gt === GovernmentType.FEUDAL_MONARCHY) {
        // Monarchy overthrown → republic or military junta
        if (pol.legitimacy > 30) {
          this.transitionGovernment(GovernmentType.REPUBLIC,
            "大規模な市民蜂起により王制が打倒されました。市民は共和制の樹立を宣言し、新たな時代の幕が開きました。「旧体制（アンシャン・レジーム）は終わった」の声が街頭に響いています。");
        } else {
          this.transitionGovernment(GovernmentType.MILITARY_JUNTA,
            "王制の崩壊後、軍部が秩序維持を名目に権力を掌握しました。「我々は国家を救うために介入する」と将軍が宣言しています。民主化への道筋は不透明です。");
        }
        return;
      }
      if (gt === GovernmentType.ONE_PARTY_STATE) {
        this.transitionGovernment(GovernmentType.REPUBLIC,
          "一党独裁体制に対する不満が爆発し、民主化運動が体制を打倒しました。広場を埋め尽くす市民の歓声が新時代の到来を告げています。しかし、真の民主主義の構築はここからが本番です。");
        return;
      }
    }

    // Military coup: military dissatisfaction + instability
    const militaryGroup = s.interestGroups.find((ig) => ig.type === "MILITARY");
    if (
      militaryGroup &&
      militaryGroup.satisfaction < 25 &&
      pol.stability < 30 &&
      gt !== GovernmentType.MILITARY_JUNTA &&
      Math.random() < 0.15
    ) {
      this.transitionGovernment(GovernmentType.MILITARY_JUNTA,
        "軍部がクーデターを決行し、政権を掌握しました。「国家の危機に際し、軍は行動する義務がある」と声明を発表。戒厳令が布告され、議会活動が停止されました。");
      return;
    }

    // Democratization pressure: high legitimacy + education + low corruption
    if (
      pol.legitimacy > 70 &&
      pol.corruption < 40 &&
      s.economic.gdp > 500 &&
      (gt === GovernmentType.ABSOLUTE_MONARCHY || gt === GovernmentType.CONSTITUTIONAL_MONARCHY) &&
      Math.random() < 0.1
    ) {
      this.transitionGovernment(GovernmentType.PARLIAMENTARY_DEMOCRACY,
        "国内外の民主化圧力が頂点に達し、議会制民主主義への平和的移行が実現しました。「これは革命ではない。進化である」と改革派指導者は語りました。歴史は静かに、しかし確実に前進しています。");
      return;
    }

    // Constitutional monarchy: absolute monarchy under pressure
    if (
      gt === GovernmentType.ABSOLUTE_MONARCHY &&
      pol.unrest > 50 &&
      pol.legitimacy > 40 &&
      Math.random() < 0.1
    ) {
      this.transitionGovernment(GovernmentType.CONSTITUTIONAL_MONARCHY,
        "議会の権限を拡大する憲法改正が行われ、立憲君主制へ移行しました。君主は「朕は国民と共に歩む」と宣言。権力は維持しつつも、その行使は制限されることになりました。");
      return;
    }

    // Military junta → democratization or one-party
    if (gt === GovernmentType.MILITARY_JUNTA && pol.stability > 60 && Math.random() < 0.08) {
      if (pol.legitimacy > 50) {
        this.transitionGovernment(GovernmentType.PARLIAMENTARY_DEMOCRACY,
          "軍政が「民政移管」を宣言し、自由選挙が実施されました。長い軍事支配の後、市民は投票所に列を成しています。真の民主主義への道のりは始まったばかりです。");
      } else {
        this.transitionGovernment(GovernmentType.ONE_PARTY_STATE,
          "軍部が「指導政党」を結成し、形式的な選挙を経て一党支配体制に移行しました。「安定のためには強い指導力が必要だ」と将軍は説明しています。");
      }
      return;
    }
  }

  private transitionGovernment(newType: GovernmentType, description: string): void {
    const s = this.state;
    const oldType = s.political.governmentType;
    s.political.governmentType = newType;

    // Transition effects
    s.political.stability = clamp(s.political.stability - 15, 0, 100);
    s.political.unrest = clamp(s.political.unrest - 10, 0, 100);
    s.political.yearsSinceElection = 0;

    // Set election cycle based on new type
    switch (newType) {
      case GovernmentType.PARLIAMENTARY_DEMOCRACY:
      case GovernmentType.REPUBLIC:
        s.political.electionCycle = 4;
        break;
      case GovernmentType.CONSTITUTIONAL_MONARCHY:
        s.political.electionCycle = 5;
        break;
      default:
        s.political.electionCycle = 0;
    }

    const oldLabel = GOVERNMENT_TYPE_LABELS[oldType];
    const newLabel = GOVERNMENT_TYPE_LABELS[newType];
    this.addNewsItem(
      `【体制変革】${oldLabel}から${newLabel}へ移行: ${description}`,
      NewsType.POLITICAL,
    );
  }

  private updateDiplomaticStatus(nation: ForeignNation): void {
    if (nation.alliance) {
      nation.status = DiplomaticStatus.ALLIANCE;
    } else if (nation.opinion >= 30) {
      nation.status = DiplomaticStatus.FRIENDLY;
    } else if (nation.opinion >= -10) {
      nation.status = DiplomaticStatus.NEUTRAL;
    } else if (nation.opinion >= -40) {
      nation.status = DiplomaticStatus.RIVAL;
    } else {
      nation.status = DiplomaticStatus.HOSTILE;
    }
  }

  private simulateDiplomacy(): void {
    const s = this.state;

    for (const nation of s.foreignNations) {
      // Opinions drift toward 0 over time
      if (nation.opinion > 0) {
        nation.opinion = clamp(nation.opinion - 1, -100, 100);
      } else if (nation.opinion < 0) {
        nation.opinion = clamp(nation.opinion + 1, -100, 100);
      }

      // Similar government types improve relations
      if (nation.governmentType === s.political.governmentType) {
        nation.opinion = clamp(nation.opinion + 1, -100, 100);
      }

      // Trade agreements boost economy and maintain goodwill
      if (nation.tradeAgreement) {
        nation.opinion = clamp(nation.opinion + 1, -100, 100);
      }

      // Hostile nations may cause diplomatic incidents
      if (nation.status === DiplomaticStatus.HOSTILE && Math.random() < 0.1) {
        s.political.stability = clamp(s.political.stability - 2, 0, 100);
        this.addNewsItem(
          `${nation.name}が国境付近で挑発行動を行い、緊張が高まっています。`,
          NewsType.DIPLOMATIC,
        );
      }

      // Alliance provides stability bonus
      if (nation.alliance) {
        s.political.stability = clamp(s.political.stability + 0.5, 0, 100);
      }

      this.updateDiplomaticStatus(nation);
    }

    // Trade agreement benefits
    const tradePartners = s.foreignNations.filter((n) => n.tradeAgreement).length;
    if (tradePartners > 0) {
      s.economic.gdpGrowth += tradePartners * 0.05;
    }
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
