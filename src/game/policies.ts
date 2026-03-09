import type { GameState } from "./types";
import { NewsType } from "./types";

// ── Policy Key ──────────────────────────────────────────────────────────────

export const SLIDER_POLICY_KEYS = [
  "tax_rate",
  "spending_defense",
  "spending_education",
  "spending_infrastructure",
  "spending_welfare",
  "spending_research",
] as const;

export const ACTION_POLICY_KEYS = [
  "anti_corruption",
  "promote_trade",
] as const;

export type SliderPolicyKey = (typeof SLIDER_POLICY_KEYS)[number];
export type ActionPolicyKey = (typeof ACTION_POLICY_KEYS)[number];
export type PolicyKey = SliderPolicyKey | ActionPolicyKey;

// ── Slider Policy Definition ────────────────────────────────────────────────

export interface SliderPolicyDef {
  kind: "slider";
  min: number;
  max: number;
  step: number;
  label: string;
  desc: string;
  apply: (state: GameState, value: number) => void;
}

// ── Action Policy Definition ────────────────────────────────────────────────

export interface ActionPolicyDef {
  kind: "action";
  label: string;
  cost: number;
  /** Called after common checks (action-used, treasury) pass and cost is deducted. */
  apply: (state: GameState) => void;
}

// ── Helper ──────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── Slider Policies ─────────────────────────────────────────────────────────

export const SLIDER_POLICIES: Record<SliderPolicyKey, SliderPolicyDef> = {
  tax_rate: {
    kind: "slider",
    min: 0,
    max: 60,
    step: 1,
    label: "税率",
    desc: "税率は歳入の源泉。高すぎるとラッファー曲線により成長率が低下。50%超は特に深刻。低すぎると歳入不足に。",
    apply: (s, v) => {
      s.economic.taxRate = clamp(v, 0, 60);
    },
  },
  spending_defense: {
    kind: "slider",
    min: 0,
    max: 50,
    step: 0.5,
    label: "国防",
    desc: "軍事費。4%以上で軍部満足。15%超で総力戦経済に突入。高すぎると民間経済を圧迫。",
    apply: (s, v) => {
      s.economic.governmentSpending.defense = clamp(v, 0, 50);
    },
  },
  spending_education: {
    kind: "slider",
    min: 0,
    max: 30,
    step: 0.5,
    label: "教育",
    desc: "人的資本への投資。長期的なGDP成長率と官僚効率を向上。知識人の満足度に影響。",
    apply: (s, v) => {
      s.economic.governmentSpending.education = clamp(v, 0, 30);
    },
  },
  spending_infrastructure: {
    kind: "slider",
    min: 0,
    max: 30,
    step: 0.5,
    label: "インフラ",
    desc: "道路・通信等の社会基盤整備。GDP成長率を直接押し上げる最も即効性のある支出。",
    apply: (s, v) => {
      s.economic.governmentSpending.infrastructure = clamp(v, 0, 30);
    },
  },
  spending_welfare: {
    kind: "slider",
    min: 0,
    max: 30,
    step: 0.5,
    label: "福祉",
    desc: "社会保障・医療等。不満を抑制し安定度を向上。12%以上で労働者層が満足。",
    apply: (s, v) => {
      s.economic.governmentSpending.welfare = clamp(v, 0, 30);
    },
  },
  spending_research: {
    kind: "slider",
    min: 0,
    max: 20,
    step: 0.5,
    label: "研究",
    desc: "科学技術への投資。長期的な成長エンジン。教育と合わせてGDP比8%以上が知識人の要望。",
    apply: (s, v) => {
      s.economic.governmentSpending.research = clamp(v, 0, 20);
    },
  },
};

// ── Action Policies ─────────────────────────────────────────────────────────

export const ACTION_POLICIES: Record<ActionPolicyKey, ActionPolicyDef> = {
  anti_corruption: {
    kind: "action",
    label: "反腐敗キャンペーン",
    cost: 10,
    apply: (s) => {
      s.political.corruption = clamp(s.political.corruption - 10, 0, 100);
      s.political.stability = clamp(s.political.stability - 3, 0, 100);
    },
  },
  promote_trade: {
    kind: "action",
    label: "貿易促進",
    cost: 5,
    apply: (s) => {
      s.economic.tradeBalance += 3;
    },
  },
};

// ── Convenience ─────────────────────────────────────────────────────────────

export const SPENDING_KEYS = [
  "spending_defense",
  "spending_education",
  "spending_infrastructure",
  "spending_welfare",
  "spending_research",
] as const;

export type SpendingPolicyKey = (typeof SPENDING_KEYS)[number];

/** Extract the governmentSpending field key from a spending policy key */
export function spendingFieldKey(
  key: SpendingPolicyKey,
): keyof GameState["economic"]["governmentSpending"] {
  return key.replace("spending_", "") as keyof GameState["economic"]["governmentSpending"];
}
