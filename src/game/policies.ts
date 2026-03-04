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
  apply: (state: GameState, value: number) => void;
}

// ── Action Policy Definition ────────────────────────────────────────────────

export interface ActionPolicyDef {
  kind: "action";
  label: string;
  cost: number;
  apply: (state: GameState, value: number, addNews: (text: string, type: NewsType) => void) => boolean;
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
    apply: (s, value, addNews) => {
      if (s.actionsUsedThisTurn.includes("anti_corruption")) {
        addNews("反腐敗キャンペーンは今期既に実施済みです。", NewsType.POLITICAL);
        return false;
      }
      if (s.economic.treasury < 10) {
        addNews("反腐敗キャンペーンのための資金が不足しています。", NewsType.POLITICAL);
        return false;
      }
      const reduction = clamp(value, 0, 20);
      s.political.corruption = clamp(s.political.corruption - reduction, 0, 100);
      s.political.stability = clamp(s.political.stability - 3, 0, 100);
      s.economic.treasury -= 10;
      s.actionsUsedThisTurn.push("anti_corruption");
      addNews("反腐敗キャンペーンが実施されました。", NewsType.POLITICAL);
      return true;
    },
  },
  promote_trade: {
    kind: "action",
    label: "貿易促進",
    cost: 5,
    apply: (s, _value, addNews) => {
      if (s.actionsUsedThisTurn.includes("promote_trade")) {
        addNews("貿易促進政策は今期既に実施済みです。", NewsType.ECONOMIC);
        return false;
      }
      if (s.economic.treasury < 5) {
        addNews("貿易促進のための資金が不足しています。", NewsType.ECONOMIC);
        return false;
      }
      s.economic.tradeBalance += 3;
      s.economic.treasury -= 5;
      s.actionsUsedThisTurn.push("promote_trade");
      addNews("貿易促進政策が実施されました。", NewsType.ECONOMIC);
      return true;
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
