import * as assert from "node:assert/strict";
import { GameEngine } from "../src/game/GameEngine";
import type { GameEvent, GameState } from "../src/game/types";
import { DiplomaticStatus, GovernmentType, NewsType } from "../src/game/types";
import { generateRandomEvent } from "../src/game/events";
import { getRelevantTips } from "../src/game/tips";
import { SLIDER_POLICIES, SLIDER_POLICY_KEYS, spendingFieldKey, type SpendingPolicyKey } from "../src/game/policies";

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
