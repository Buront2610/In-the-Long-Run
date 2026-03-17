import * as assert from "node:assert/strict";
import { GameEngine } from "../src/game/GameEngine";
import type { GameEvent, GameState } from "../src/game/types";
import { DiplomaticStatus, GovernmentType, NewsType } from "../src/game/types";
import { generateRandomEvent, CHAINED_EVENTS, RANDOM_EVENTS } from "../src/game/events";
import { getRelevantTips } from "../src/game/tips";
import { SLIDER_POLICIES, SLIDER_POLICY_KEYS, spendingFieldKey, type SpendingPolicyKey } from "../src/game/policies";
import { computeForecast } from "../src/game/forecast";
import { MAX_SLIDER_CHANGES_PER_TURN } from "../src/game/constants";

function mutableState(engine: GameEngine): GameState {
  return (engine as unknown as { state: GameState }).state;
}

function nearlyEqual(a: number, b: number, tolerance = 0.05): boolean {
  return Math.abs(a - b) <= tolerance;
}

function testFiscalSurplusNoDoubleCount(): void {
  const engine = new GameEngine();
  engine.applyPolicy("tax_rate", 60);
  engine.applyPolicy("spending_defense", 0);
  engine.applyPolicy("spending_education", 0);
  engine.applyPolicy("spending_infrastructure", 0);
  engine.applyPolicy("spending_welfare", 0);
  engine.applyPolicy("spending_research", 0);

  const before = engine.getState().economic;
  engine.nextTurn();
  const after = engine.getState().economic;

  const netWorthBefore = before.treasury - before.debt;
  const netWorthAfter = after.treasury - after.debt;
  const netWorthDelta = netWorthAfter - netWorthBefore;

  assert.equal(
    nearlyEqual(netWorthDelta, after.fiscalBalance),
    true,
    `Net worth delta ${netWorthDelta} must match fiscal balance ${after.fiscalBalance}`,
  );
}

function testEventChoiceImmediateGameOver(): void {
  const engine = new GameEngine();
  const state = mutableState(engine);

  state.political.stability = 10;
  const event: GameEvent = {
    id: "test-collapse",
    title: "Test collapse",
    description: "Test event",
    year: state.year,
    effects: {},
    choices: [
      {
        text: "Cause collapse",
        effects: { stability: -20 },
      },
    ],
  };
  state.activeEvents.push(event);

  engine.handleEventChoice(event.id, 0);
  const after = engine.getState();

  assert.equal(after.gameOver, true);
}

function testDenounceUpdatesThirdPartyStatus(): void {
  const engine = new GameEngine();
  const state = mutableState(engine);

  const target = state.foreignNations[0];
  const other = state.foreignNations[1];
  other.opinion = -41;
  other.status = DiplomaticStatus.HOSTILE;

  const ok = engine.performDiplomaticAction(target.id, "denounce");
  const afterOther = engine.getState().foreignNations.find((n) => n.id === other.id);

  assert.equal(ok, true);
  assert.ok(afterOther);
  assert.equal(afterOther!.opinion, -36);
  assert.equal(afterOther!.status, DiplomaticStatus.RIVAL);
}

function testDebtToGdpSyncAfterEventEffects(): void {
  const engine = new GameEngine();
  const state = mutableState(engine);

  const event: GameEvent = {
    id: "test-debt",
    title: "Debt shock",
    description: "Increase debt",
    year: state.year,
    effects: {},
    choices: [
      {
        text: "Increase debt",
        effects: { debt: 100 },
      },
    ],
  };
  state.activeEvents.push(event);

  engine.handleEventChoice(event.id, 0);
  const after = engine.getState().economic;
  const expected = (after.debt / after.gdp) * 100;

  assert.equal(nearlyEqual(after.debtToGdpRatio, expected, 0.0001), true);
}

function testSpecialActionsOncePerTurn(): void {
  const engine = new GameEngine();
  const before = engine.getState().economic.treasury;

  engine.applyPolicy("anti_corruption", 10);
  const afterFirst = engine.getState().economic.treasury;
  engine.applyPolicy("anti_corruption", 10);
  const afterSecond = engine.getState().economic.treasury;

  assert.equal(afterFirst, before - 10);
  assert.equal(afterSecond, afterFirst);

  const news = engine.getState().news;
  assert.equal(news.some((n) => n.type === NewsType.POLITICAL), true);
}

function testGetStateReturnsIsolatedSnapshot(): void {
  const engine = new GameEngine();

  const snapshot = engine.getState();
  snapshot.economic.taxRate = 0;
  snapshot.foreignNations[0].opinion = -100;
  snapshot.actionsUsedThisTurn.push("tamper");

  const fresh = engine.getState();
  assert.equal(fresh.economic.taxRate, 30);
  assert.notEqual(fresh.foreignNations[0].opinion, -100);
  assert.equal(fresh.actionsUsedThisTurn.includes("tamper"), false);
}

function testPolicyBoundsAreClamped(): void {
  const engine = new GameEngine();

  engine.applyPolicy("tax_rate", -10);
  assert.equal(engine.getState().economic.taxRate, 0);

  engine.applyPolicy("tax_rate", 100);
  assert.equal(engine.getState().economic.taxRate, 60);

  engine.applyPolicy("spending_research", 50);
  assert.equal(engine.getState().economic.governmentSpending.research, 20);
}

function testPerTurnActionLimitResetsOnNextTurn(): void {
  const engine = new GameEngine();
  const before = engine.getState().economic.treasury;

  engine.applyPolicy("promote_trade", 5);
  const afterFirstUse = engine.getState().economic.treasury;
  engine.applyPolicy("promote_trade", 5);
  const afterBlockedUse = engine.getState().economic.treasury;

  assert.equal(afterFirstUse, before - 5);
  assert.equal(afterBlockedUse, afterFirstUse);

  engine.nextTurn();
  const beforeSecondTurnUse = engine.getState().economic.treasury;
  engine.applyPolicy("promote_trade", 5);
  const afterSecondTurnUse = engine.getState().economic.treasury;
  assert.equal(afterSecondTurnUse, beforeSecondTurnUse - 5);
}

function testNewsIsCappedAt50Items(): void {
  const engine = new GameEngine();
  for (let i = 0; i < 60; i += 1) {
    engine.addNewsItem(`item-${i}`, NewsType.ECONOMIC);
  }

  const news = engine.getState().news;
  assert.equal(news.length, 50);
  assert.equal(news[0].text, "item-59");
  assert.equal(news[49].text, "item-10");
}

function testInstitutionAdoptAndRevokeRules(): void {
  const engine = new GameEngine();
  const before = engine.getState().economic.treasury;

  const adoptFreePressFirst = engine.adoptInstitution("free_press");
  assert.equal(adoptFreePressFirst, false);
  assert.equal(engine.getState().economic.treasury, before);

  const adoptRuleOfLaw = engine.adoptInstitution("rule_of_law");
  const adoptFreePress = engine.adoptInstitution("free_press");
  assert.equal(adoptRuleOfLaw, true);
  assert.equal(adoptFreePress, true);

  const afterAdopt = engine.getState();
  const ruleOfLaw = afterAdopt.institutions.find((i) => i.id === "rule_of_law");
  const freePress = afterAdopt.institutions.find((i) => i.id === "free_press");
  assert.equal(ruleOfLaw?.adopted, true);
  assert.equal(freePress?.adopted, true);

  const revokeRuleOfLaw = engine.revokeInstitution("rule_of_law");
  assert.equal(revokeRuleOfLaw, false);

  const revokeFreePress = engine.revokeInstitution("free_press");
  assert.equal(revokeFreePress, true);
  const finalFreePress = engine.getState().institutions.find((i) => i.id === "free_press");
  assert.equal(finalFreePress?.adopted, false);
}

function testDiplomaticActionFailurePaths(): void {
  const engine = new GameEngine();
  const state = mutableState(engine);
  const nation = state.foreignNations[0];

  state.economic.treasury = 0;
  const beforeOpinion = nation.opinion;
  const improve = engine.performDiplomaticAction(nation.id, "improve_relations");
  assert.equal(improve, false);
  assert.equal(engine.getState().foreignNations[0].opinion, beforeOpinion);

  state.economic.treasury = 100;
  nation.opinion = -20;
  const beforeTrade = state.economic.tradeBalance;
  const trade = engine.performDiplomaticAction(nation.id, "trade_agreement");
  assert.equal(trade, false);
  assert.equal(engine.getState().economic.tradeBalance, beforeTrade);
}

function testGameOverByDebtAndInflation(): void {
  const engineDebt = new GameEngine();
  const debtState = mutableState(engineDebt);
  debtState.economic.debt = debtState.economic.gdp * 3.1;
  const debtEvent: GameEvent = {
    id: "go-debt",
    title: "Debt",
    description: "Debt",
    year: debtState.year,
    effects: {},
    choices: [{ text: "noop", effects: {} }],
  };
  debtState.activeEvents.push(debtEvent);
  engineDebt.handleEventChoice(debtEvent.id, 0);
  assert.equal(engineDebt.getState().gameOver, true);

  const engineInflation = new GameEngine();
  const inflationState = mutableState(engineInflation);
  inflationState.economic.inflation = 51;
  const infEvent: GameEvent = {
    id: "go-inf",
    title: "Inflation",
    description: "Inflation",
    year: inflationState.year,
    effects: {},
    choices: [{ text: "noop", effects: {} }],
  };
  inflationState.activeEvents.push(infEvent);
  engineInflation.handleEventChoice(infEvent.id, 0);
  assert.equal(engineInflation.getState().gameOver, true);
}

function testWarEconomyToggleAcrossTurns(): void {
  const engine = new GameEngine();
  engine.applyPolicy("spending_defense", 16);
  engine.nextTurn();
  assert.equal(engine.getState().economic.isWarEconomy, true);

  engine.applyPolicy("spending_defense", 5);
  engine.nextTurn();
  assert.equal(engine.getState().economic.isWarEconomy, false);
}

function testGovernmentTransitionPathDeterministic(): void {
  const engine = new GameEngine(null, () => 0);
  const state = mutableState(engine);
  state.political.governmentType = GovernmentType.ABSOLUTE_MONARCHY;
  state.political.unrest = 60;
  state.political.legitimacy = 50;
  state.political.stability = 50;

  engine.nextTurn();

  assert.equal(
    engine.getState().political.governmentType,
    GovernmentType.CONSTITUTIONAL_MONARCHY,
  );
}

function testTipsBoundaryTrigger(): void {
  const engine = new GameEngine();
  const state = engine.getState();
  state.economic.debtToGdpRatio = 101;
  state.economic.unemployment = 16;
  state.economic.inflation = 11;

  const tips = getRelevantTips(state);
  const triggers = new Set(tips.map((t) => t.trigger));
  assert.equal(triggers.has("policy_warning"), true);
  assert.equal(triggers.has("unemployment_high"), true);
  assert.equal(triggers.has("inflation_high"), true);
}

function testHistoryRecordsPreTurnYear(): void {
  const engine = new GameEngine();
  const initialYear = engine.getState().year;
  engine.nextTurn();
  const after = engine.getState();

  assert.equal(after.year, initialYear + 1);
  assert.equal(after.history.length >= 1, true);
  assert.equal(after.history[0].year, initialYear);
}

function testRandomEventGenerationGate(): void {
  const engine = new GameEngine();
  const state = engine.getState();
  const year = state.year;

  const event = generateRandomEvent(year, state, () => 0.99);
  assert.equal(event, null);
}

// ── Phase 0: Invariant Tests ────────────────────────────────────────────

function testInvariantNewsCap(): void {
  const engine = new GameEngine(null, () => 0);
  for (let i = 0; i < 100; i++) {
    engine.nextTurn();
    const news = engine.getState().news;
    assert.ok(news.length <= 50, `News length ${news.length} exceeds 50 at turn ${i + 1}`);
  }
}

function testInvariantClampedValues(): void {
  const engine = new GameEngine();
  // Apply extreme policies
  engine.applyPolicy("tax_rate", -100);
  engine.applyPolicy("spending_defense", 999);
  engine.applyPolicy("spending_education", -50);
  engine.applyPolicy("spending_infrastructure", 999);
  engine.applyPolicy("spending_welfare", -50);
  engine.applyPolicy("spending_research", 999);

  const s = engine.getState();
  assert.ok(s.economic.taxRate >= 0 && s.economic.taxRate <= 60, `Tax rate ${s.economic.taxRate} out of range [0,60]`);
  assert.ok(s.economic.governmentSpending.defense >= 0 && s.economic.governmentSpending.defense <= 50, `Defense ${s.economic.governmentSpending.defense} out of range [0,50]`);
  assert.ok(s.economic.governmentSpending.education >= 0 && s.economic.governmentSpending.education <= 30, `Education ${s.economic.governmentSpending.education} out of range [0,30]`);
  assert.ok(s.economic.governmentSpending.infrastructure >= 0 && s.economic.governmentSpending.infrastructure <= 30, `Infrastructure ${s.economic.governmentSpending.infrastructure} out of range [0,30]`);
  assert.ok(s.economic.governmentSpending.welfare >= 0 && s.economic.governmentSpending.welfare <= 30, `Welfare ${s.economic.governmentSpending.welfare} out of range [0,30]`);
  assert.ok(s.economic.governmentSpending.research >= 0 && s.economic.governmentSpending.research <= 20, `Research ${s.economic.governmentSpending.research} out of range [0,20]`);
}

function testRngDeterminism(): void {
  // Simple seeded RNG (mulberry32)
  function mulberry32(seed: number): () => number {
    let s = seed;
    return () => {
      s |= 0;
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const engine1 = new GameEngine(null, mulberry32(42));
  const engine2 = new GameEngine(null, mulberry32(42));

  for (let i = 0; i < 10; i++) {
    engine1.nextTurn();
    engine2.nextTurn();
  }

  const s1 = engine1.getState();
  const s2 = engine2.getState();
  assert.equal(s1.economic.gdp, s2.economic.gdp, "Same seed should produce identical GDP");
  assert.equal(s1.political.stability, s2.political.stability, "Same seed should produce identical stability");
  assert.equal(s1.year, s2.year, "Same seed should produce identical year");
  assert.equal(s1.news.length, s2.news.length, "Same seed should produce identical news count");
}

function testAllSliderPolicyBounds(): void {
  for (const key of SLIDER_POLICY_KEYS) {
    const def = SLIDER_POLICIES[key];
    const engine = new GameEngine();

    // Apply value far below min
    engine.applyPolicy(key, def.min - 100);
    let state = engine.getState();

    // Read back the value
    let actual: number;
    if (key === "tax_rate") {
      actual = state.economic.taxRate;
    } else {
      const field = spendingFieldKey(key as SpendingPolicyKey);
      actual = state.economic.governmentSpending[field];
    }
    assert.ok(actual >= def.min, `${key}: value ${actual} below min ${def.min}`);

    // Apply value far above max
    engine.applyPolicy(key, def.max + 100);
    state = engine.getState();
    if (key === "tax_rate") {
      actual = state.economic.taxRate;
    } else {
      const field = spendingFieldKey(key as SpendingPolicyKey);
      actual = state.economic.governmentSpending[field];
    }
    assert.ok(actual <= def.max, `${key}: value ${actual} above max ${def.max}`);
  }
}

function testInvariantActionLimits(): void {
  const engine = new GameEngine();

  // Use both special actions
  engine.applyPolicy("anti_corruption", 10);
  engine.applyPolicy("promote_trade", 5);

  // Try again - should be no-op
  const treasuryAfterFirst = engine.getState().economic.treasury;
  engine.applyPolicy("anti_corruption", 10);
  engine.applyPolicy("promote_trade", 5);
  const treasuryAfterDuplicate = engine.getState().economic.treasury;

  assert.equal(treasuryAfterDuplicate, treasuryAfterFirst, "Duplicate special actions should not spend treasury");

  // Verify actionsUsedThisTurn contains exactly the two actions
  const actions = engine.getState().actionsUsedThisTurn;
  assert.equal(actions.filter((a) => a === "anti_corruption").length, 1);
  assert.equal(actions.filter((a) => a === "promote_trade").length, 1);
}

// ── Phase 1: Policy Friction Tests ─────────────────────────────────────────

function testSliderChangeTracking(): void {
  const engine = new GameEngine();

  // No changes yet
  assert.equal(engine.getState().sliderChangesThisTurn.length, 0);

  engine.applyPolicy("tax_rate", 35);
  engine.applyPolicy("spending_defense", 4);
  assert.equal(engine.getState().sliderChangesThisTurn.length, 2);

  // Changing the same slider again does not increment the counter
  engine.applyPolicy("tax_rate", 25);
  assert.equal(engine.getState().sliderChangesThisTurn.length, 2);
}

function testSliderChangeLimitStabilityCost(): void {
  const engine = new GameEngine();
  const stabilityBefore = engine.getState().political.stability;

  // Exhaust free changes
  engine.applyPolicy("tax_rate", 35);
  engine.applyPolicy("spending_defense", 4);
  engine.applyPolicy("spending_education", 6);

  // Stability should still be unchanged at the free limit
  assert.equal(engine.getState().political.stability, stabilityBefore);

  // 4th unique slider: stability cost kicks in
  engine.applyPolicy("spending_infrastructure", 5);
  assert.equal(engine.getState().political.stability, stabilityBefore - 1);

  // 5th unique slider: another stability cost
  engine.applyPolicy("spending_welfare", 10);
  assert.equal(engine.getState().political.stability, stabilityBefore - 2);
}

function testSliderChangeLimitResetsOnNextTurn(): void {
  const engine = new GameEngine();

  // Use up the free limit
  engine.applyPolicy("tax_rate", 35);
  engine.applyPolicy("spending_defense", 4);
  engine.applyPolicy("spending_education", 6);
  assert.equal(engine.getState().sliderChangesThisTurn.length, 3);

  engine.nextTurn();

  // Counter should be reset
  assert.equal(engine.getState().sliderChangesThisTurn.length, 0);

  // And free changes are available again without stability cost
  const stabilityAfterReset = engine.getState().political.stability;
  engine.applyPolicy("tax_rate", 30);
  engine.applyPolicy("spending_defense", 5);
  engine.applyPolicy("spending_education", 5);
  engine.applyPolicy("spending_welfare", 11);
  // Only the 4th is an excess here
  assert.ok(engine.getState().political.stability < stabilityAfterReset);
}

function testMaxSliderChangesConstantIsThree(): void {
  // Ensure the game-balance constant is as designed
  assert.equal(MAX_SLIDER_CHANGES_PER_TURN, 3);
}

// ── Phase 2: Forecast Tests ─────────────────────────────────────────────────

function testForecastGdpUpWithProductiveSpending(): void {
  const engine = new GameEngine();
  const state = mutableState(engine);
  // High productive spending, low corruption
  state.economic.governmentSpending.infrastructure = 10;
  state.economic.governmentSpending.education = 10;
  state.economic.governmentSpending.research = 10;
  state.political.corruption = 20;
  state.economic.taxRate = 30;
  state.economic.gdpGrowth = 3;

  const forecast = computeForecast(state);
  assert.equal(forecast.gdp.trend, "up", "High productive spending should forecast GDP up");
}

function testForecastGdpDownWithHighCorruptionTaxDrag(): void {
  const engine = new GameEngine();
  const state = mutableState(engine);
  state.economic.governmentSpending.infrastructure = 0;
  state.economic.governmentSpending.education = 0;
  state.economic.governmentSpending.research = 0;
  state.political.corruption = 90;
  state.economic.taxRate = 60;
  state.economic.gdpGrowth = -3;

  const forecast = computeForecast(state);
  assert.equal(forecast.gdp.trend, "down", "High corruption, high tax, and negative growth should forecast GDP down");
}

function testForecastInflationUpInWarEconomy(): void {
  const engine = new GameEngine();
  const state = mutableState(engine);
  state.economic.isWarEconomy = true;
  state.economic.inflation = 5;

  const forecast = computeForecast(state);
  assert.equal(forecast.inflation.trend, "up", "War economy should forecast inflation up");
}

function testForecastStabilityDownWithHighUnrest(): void {
  const engine = new GameEngine();
  const state = mutableState(engine);
  state.political.unrest = 70;
  state.economic.unemployment = 20;
  state.economic.inflation = 15;
  state.economic.gdpGrowth = -2;

  const forecast = computeForecast(state);
  assert.equal(forecast.stability.trend, "down", "High unrest + bad economy should forecast stability down");
}

function testForecastUnemploymentDownWithHighGrowth(): void {
  const engine = new GameEngine();
  const state = mutableState(engine);
  state.economic.gdpGrowth = 5;

  const forecast = computeForecast(state);
  assert.equal(forecast.unemployment.trend, "down", "High GDP growth should forecast unemployment down");
}

function testForecastIsPureFunction(): void {
  // computeForecast must not mutate state
  const engine = new GameEngine();
  const stateBefore = engine.getState();
  computeForecast(stateBefore);
  const stateAfter = engine.getState();

  assert.equal(stateAfter.economic.gdp, stateBefore.economic.gdp);
  assert.equal(stateAfter.political.stability, stateBefore.political.stability);
}

// ── Phase 3: Event Chain Tests ──────────────────────────────────────────────

function testEventChainRegisteredAfterChoice(): void {
  const engine = new GameEngine();
  const state = mutableState(engine);

  // Inject the drought event
  const droughtTemplate = {
    id: "drought",
    title: "干ばつ",
    description: "テスト",
    year: state.year,
    effects: {},
    choices: [
      { text: "輸入", effects: {} },
      { text: "配給制", effects: {}, triggersEventId: "food_crisis_aftermath" },
    ],
  };
  state.activeEvents.push(droughtTemplate);

  // Choose the choice that triggers a chain
  engine.handleEventChoice("drought", 1);

  assert.equal(
    engine.getState().pendingChainEventId,
    "food_crisis_aftermath",
    "Choosing a chain-triggering option should set pendingChainEventId",
  );
}

function testEventChainTriggeredOnNextTurn(): void {
  const engine = new GameEngine(null, () => 0.99); // rng > 0.35 suppresses random events
  const state = mutableState(engine);

  // Set up a pending chain
  state.pendingChainEventId = "food_crisis_aftermath";

  engine.nextTurn();

  const afterState = engine.getState();
  const chainedEvent = afterState.activeEvents.find((e) => e.id === "food_crisis_aftermath");
  assert.ok(chainedEvent, "Chained event should appear in activeEvents on next turn");
  assert.equal(afterState.pendingChainEventId, null, "pendingChainEventId should be cleared after triggering");
}

function testNonChainChoiceClearsPendingChain(): void {
  const engine = new GameEngine();
  const state = mutableState(engine);

  // Pre-set a pending chain
  state.pendingChainEventId = "food_crisis_aftermath";

  const event: GameEvent = {
    id: "test-no-chain",
    title: "Test",
    description: "Test",
    year: state.year,
    effects: {},
    choices: [{ text: "No chain", effects: {} }], // no triggersEventId
  };
  state.activeEvents.push(event);

  engine.handleEventChoice("test-no-chain", 0);

  assert.equal(
    engine.getState().pendingChainEventId,
    null,
    "Choosing a non-chain option should clear pendingChainEventId",
  );
}

function testChainedEventsArrayIsNonEmpty(): void {
  assert.ok(CHAINED_EVENTS.length > 0, "CHAINED_EVENTS should have entries");
  for (const e of CHAINED_EVENTS) {
    assert.ok(e.id, `Chained event must have an id`);
    assert.ok(e.choices.length > 0, `Chained event ${e.id} must have choices`);
  }
}

function testGenerateRandomEventPreservesTriggersEventId(): void {
  // Confirm the drought template's second choice carries triggersEventId
  const droughtTemplate = RANDOM_EVENTS.find((e) => e.id === "drought");
  assert.ok(droughtTemplate, "drought event must exist in RANDOM_EVENTS");
  assert.equal(droughtTemplate.choices[1].triggersEventId, "food_crisis_aftermath");

  const engine = new GameEngine();
  const state = engine.getState();
  const year = state.year;

  // Replicate the same filter generateRandomEvent uses, to get the correct
  // candidates array length and drought's position within it.
  const candidates = RANDOM_EVENTS.filter((e) => {
    if (e.id === "bubble_burst" && state.economic.gdpGrowth < 0) return false;
    if (e.id === "labor_strike" && state.economic.unemployment > 20) return false;
    if (e.id === "resource_discovery" && state.economic.gdpGrowth > 8) return false;
    if (e.id === "trade_war" && state.economic.gdp < 300) return false;
    if (e.id === "international_summit" && state.economic.gdp < 500) return false;
    if (e.id === "constitutional_crisis" && state.political.stability > 60) return false;
    if (e.id === "succession_crisis" && state.political.electionCycle > 0) return false;
    if (e.id === "corruption_network_exposed" && state.political.corruption < 40) return false;
    return true;
  });

  const droughtIdx = candidates.findIndex((e) => e.id === "drought");
  assert.ok(droughtIdx >= 0, "drought must be present in filtered candidates");

  // RNG: call 1 ≤ 0.35 → event fires; call 2 selects drought by index
  let callCount = 0;
  const fakeRng = (): number => {
    callCount += 1;
    if (callCount === 1) return 0.1;
    return droughtIdx / candidates.length;
  };

  const event = generateRandomEvent(year, state, fakeRng);
  assert.ok(event, "generateRandomEvent should return an event");
  assert.equal(event!.id, "drought", "Should have generated the drought event");

  // The critical assertion: triggersEventId must survive the deep-copy
  assert.equal(
    event!.choices[1].triggersEventId,
    "food_crisis_aftermath",
    "triggersEventId must be preserved by generateRandomEvent choice copy",
  );
}

function testProductionPathChainEndToEnd(): void {
  // Full production path:
  //  1. generateRandomEvent picks drought
  //  2. handleEventChoice picks choice index 1 (rationing system) which has triggersEventId
  //  3. pendingChainEventId is set
  //  4. nextTurn delivers the chained event into activeEvents

  const engine = new GameEngine();
  const engineState = engine.getState();
  const state = mutableState(engine);
  const year = state.year;

  // Use the same filter replication to find drought in filtered candidates
  const candidates = RANDOM_EVENTS.filter((e) => {
    if (e.id === "bubble_burst" && engineState.economic.gdpGrowth < 0) return false;
    if (e.id === "labor_strike" && engineState.economic.unemployment > 20) return false;
    if (e.id === "resource_discovery" && engineState.economic.gdpGrowth > 8) return false;
    if (e.id === "trade_war" && engineState.economic.gdp < 300) return false;
    if (e.id === "international_summit" && engineState.economic.gdp < 500) return false;
    if (e.id === "constitutional_crisis" && engineState.political.stability > 60) return false;
    if (e.id === "succession_crisis" && engineState.political.electionCycle > 0) return false;
    if (e.id === "corruption_network_exposed" && engineState.political.corruption < 40) return false;
    return true;
  });
  const droughtIdx = candidates.findIndex((e) => e.id === "drought");

  let call = 0;
  const rngPickDrought = (): number => {
    call += 1;
    if (call === 1) return 0.1;
    return droughtIdx / candidates.length;
  };

  // Generate event via real path and push onto state
  const event = generateRandomEvent(year, engineState, rngPickDrought);
  assert.ok(event && event.id === "drought", "Expected drought event from production path");
  state.activeEvents.push(event!);

  // Player picks choice index 1 (配給制) which carries triggersEventId
  engine.handleEventChoice("drought", 1);
  assert.equal(
    engine.getState().pendingChainEventId,
    "food_crisis_aftermath",
    "pendingChainEventId must be set after choosing chain-triggering choice via production path",
  );

  // Turn 2: use a fresh engine with rng=0.99 (suppresses random events) and pre-set the chain
  const engine2 = new GameEngine(null, () => 0.99);
  const state2 = mutableState(engine2);
  state2.pendingChainEventId = "food_crisis_aftermath";

  engine2.nextTurn();

  const afterState = engine2.getState();
  const chainedEvent = afterState.activeEvents.find((e) => e.id === "food_crisis_aftermath");
  assert.ok(chainedEvent, "Chained event food_crisis_aftermath must appear in activeEvents on next turn");
  assert.equal(afterState.pendingChainEventId, null, "pendingChainEventId must be null after chain fires");
}

type TestCase = { name: string; run: () => void };

const cases: TestCase[] = [
  { name: "fiscal surplus does not double count net worth", run: testFiscalSurplusNoDoubleCount },
  { name: "event choice can trigger immediate game over", run: testEventChoiceImmediateGameOver },
  { name: "denounce updates third-party diplomatic status immediately", run: testDenounceUpdatesThirdPartyStatus },
  { name: "debt-to-GDP ratio is synchronized after event effects", run: testDebtToGdpSyncAfterEventEffects },
  { name: "special actions are limited to once per turn", run: testSpecialActionsOncePerTurn },
  { name: "getState returns isolated snapshot", run: testGetStateReturnsIsolatedSnapshot },
  { name: "policy bounds are clamped", run: testPolicyBoundsAreClamped },
  { name: "per-turn action limits reset on next turn", run: testPerTurnActionLimitResetsOnNextTurn },
  { name: "news list is capped at 50 items", run: testNewsIsCappedAt50Items },
  { name: "institution adopt/revoke rules are enforced", run: testInstitutionAdoptAndRevokeRules },
  { name: "diplomatic action failure paths do not mutate state", run: testDiplomaticActionFailurePaths },
  { name: "game over is triggered by debt ratio and inflation", run: testGameOverByDebtAndInflation },
  { name: "war economy toggles correctly across turns", run: testWarEconomyToggleAcrossTurns },
  { name: "government transition path is deterministic under fixed random", run: testGovernmentTransitionPathDeterministic },
  { name: "tips trigger at boundary conditions", run: testTipsBoundaryTrigger },
  { name: "history records pre-turn year", run: testHistoryRecordsPreTurnYear },
  { name: "random event gate returns null when random exceeds threshold", run: testRandomEventGenerationGate },
  { name: "invariant: news never exceeds 50 items over 100 turns", run: testInvariantNewsCap },
  { name: "invariant: policy values are always clamped to valid ranges", run: testInvariantClampedValues },
  { name: "invariant: special actions limited to once per turn", run: testInvariantActionLimits },
  { name: "rng injection produces deterministic results with same seed", run: testRngDeterminism },
  { name: "all slider policies respect bounds from POLICIES definition", run: testAllSliderPolicyBounds },
  // Phase 1: Policy Friction
  { name: "slider change tracking counts unique keys per turn", run: testSliderChangeTracking },
  { name: "slider change limit applies stability cost for excess changes", run: testSliderChangeLimitStabilityCost },
  { name: "slider change limit resets on next turn", run: testSliderChangeLimitResetsOnNextTurn },
  { name: "MAX_SLIDER_CHANGES_PER_TURN constant equals 3", run: testMaxSliderChangesConstantIsThree },
  // Phase 2: Forecast
  { name: "forecast: GDP up with high productive spending", run: testForecastGdpUpWithProductiveSpending },
  { name: "forecast: GDP down with high corruption and tax drag", run: testForecastGdpDownWithHighCorruptionTaxDrag },
  { name: "forecast: inflation up in war economy", run: testForecastInflationUpInWarEconomy },
  { name: "forecast: stability down with high unrest and bad economy", run: testForecastStabilityDownWithHighUnrest },
  { name: "forecast: unemployment down with high growth", run: testForecastUnemploymentDownWithHighGrowth },
  { name: "forecast: computeForecast is a pure function", run: testForecastIsPureFunction },
  // Phase 3: Event Chaining
  { name: "event chain: chain id is registered after triggering choice", run: testEventChainRegisteredAfterChoice },
  { name: "event chain: chained event is pushed to activeEvents on next turn", run: testEventChainTriggeredOnNextTurn },
  { name: "event chain: non-chain choice clears pendingChainEventId", run: testNonChainChoiceClearsPendingChain },
  { name: "event chain: CHAINED_EVENTS array is non-empty and valid", run: testChainedEventsArrayIsNonEmpty },
  { name: "event chain: generateRandomEvent preserves triggersEventId in choice copy", run: testGenerateRandomEventPreservesTriggersEventId },
  { name: "event chain: production path end-to-end (generate → choose → pendingChain → nextTurn fires chain)", run: testProductionPathChainEndToEnd },
];

let failures = 0;
for (const testCase of cases) {
  try {
    testCase.run();
    console.log(`PASS: ${testCase.name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL: ${testCase.name}`);
    console.error(error);
  }
}

if (failures > 0) {
  throw new Error(`${failures} test(s) failed`);
}
