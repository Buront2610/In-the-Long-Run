import type {
  GameState,
  Scenario,
  Institution,
  InterestGroup,
  ForeignNation,
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
import { getRelevantTips } from "./tips";
import {
  SLIDER_POLICIES,
  ACTION_POLICIES,
  type SliderPolicyKey,
  type ActionPolicyKey,
} from "./policies";
import {
  simulateEconomy,
  updateInterestGroups,
  checkGovernmentTransition,
  processElectionCycle,
  simulateDiplomacy,
  performDiplomaticAction as doDiplomaticAction,
  generateAndPushEvent,
  handleEventChoice as doHandleEventChoice,
  checkGameOver,
  addNewsItem,
  applyEffect,
  syncDebtToGdpRatio,
  clamp,
} from "./systems";

// ── Helpers ─────────────────────────────────────────────────────────────────

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
  private previousDefenseRate: number;
  private rng: () => number;

  constructor(scenario: Scenario | null = null, rng?: () => number) {
    this.rng = rng ?? Math.random;
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
      actionsUsedThisTurn: [],
    };

    this.previousDefenseRate = this.state.economic.governmentSpending.defense;
  }

  // ── Public API ──────────────────────────────────────────────────────────

  getState(): GameState {
    return structuredClone(this.state);
  }

  nextTurn(): GameState {
    if (this.state.gameOver || this.state.isPaused) {
      return this.state;
    }

    const s = this.state;

    // Reset per-turn action limits
    s.actionsUsedThisTurn = [];

    // Record current state
    this.recordHistory();

    // Interest group reactions
    updateInterestGroups(s);

    // Economic simulation
    simulateEconomy(s, this.previousDefenseRate);

    // Diplomatic simulation
    simulateDiplomacy(s, this.rng);

    // Advance time
    s.year += 1;
    s.era = getEraForYear(s.year);

    // Election cycle
    processElectionCycle(s);

    // Government type transition check
    checkGovernmentTransition(s, this.rng);

    // Generate random event
    generateAndPushEvent(s, this.rng);

    // Gather relevant tips
    s.tips = getRelevantTips(s);

    // Check game over conditions
    checkGameOver(s);

    // Track defense rate for demobilization shock next turn
    this.previousDefenseRate = s.economic.governmentSpending.defense;

    return this.state;
  }

  applyPolicy(action: string, value: number): void {
    const sliderDef = SLIDER_POLICIES[action as SliderPolicyKey];
    if (sliderDef) {
      sliderDef.apply(this.state, value);
      return;
    }

    const actionDef = ACTION_POLICIES[action as ActionPolicyKey];
    if (actionDef) {
      actionDef.apply(this.state, value, (text, type) => addNewsItem(this.state, text, type));
      return;
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
        addNewsItem(s,
          `制度「${inst.name}」の前提条件が満たされていません。`,
          NewsType.POLITICAL,
        );
        return false;
      }
    }

    // Check treasury
    if (s.economic.treasury < inst.adoptionCost) {
      addNewsItem(s,
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
      applyEffect(s, key, value);
    }
    syncDebtToGdpRatio(s);

    addNewsItem(s,
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
      addNewsItem(s,
        `制度「${inst.name}」は他の制度（${names}）の前提条件のため廃止できません。`,
        NewsType.POLITICAL,
      );
      return false;
    }

    inst.adopted = false;

    // Reverse institution effects
    for (const [key, value] of Object.entries(inst.effects)) {
      applyEffect(s, key, -value);
    }
    syncDebtToGdpRatio(s);

    // Revoking causes instability and unrest
    s.political.stability = clamp(s.political.stability - 5, 0, 100);
    s.political.unrest = clamp(s.political.unrest + 5, 0, 100);

    addNewsItem(s,
      `制度「${inst.name}」が廃止されました。社会に動揺が広がっています。`,
      NewsType.POLITICAL,
    );
    return true;
  }

  // ── Diplomatic Actions ──────────────────────────────────────────────

  performDiplomaticAction(nationId: string, action: string): boolean {
    return doDiplomaticAction(this.state, nationId, action);
  }

  handleEventChoice(eventId: string, choiceIndex: number): void {
    doHandleEventChoice(this.state, eventId, choiceIndex);
    checkGameOver(this.state);
  }

  addNewsItem(text: string, type: NewsType): void {
    addNewsItem(this.state, text, type);
  }

  // ── Private Helpers ───────────────────────────────────────────────────

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
}
