import { GovernmentType, Era } from "./types";

// ── Default States (re-exported from data/defaults) ─────────────────────────

export { DEFAULT_ECONOMIC_STATE, DEFAULT_POLITICAL_STATE } from "./data/defaults";

export const WAR_ECONOMY_THRESHOLD = 15;

// ── Data re-exports (actual data lives in data/) ────────────────────────────

export { INITIAL_INSTITUTIONS } from "./data/institutions";
export { INITIAL_INTEREST_GROUPS } from "./data/interestGroups";
export { INITIAL_FOREIGN_NATIONS } from "./data/foreignNations";
export { SCENARIOS } from "./data/scenarios";

// ── Government Type Descriptions ────────────────────────────────────────────

export const GOVERNMENT_TYPE_DESCRIPTIONS: Record<GovernmentType, string> = {
  [GovernmentType.TRIBAL]: "部族の長老たちによる合議制。決定は遅いが正統性は高い。大規模な統治には不向き。",
  [GovernmentType.CHIEFDOM]: "有力な首長による支配。部族社会からの自然な発展形態。",
  [GovernmentType.MONARCHY]: "世襲の君主による統治。安定性は高いが、君主の能力に依存する。",
  [GovernmentType.FEUDAL_MONARCHY]: "封建的な主従関係に基づく分権的統治。地方貴族の自律性が高い。",
  [GovernmentType.ABSOLUTE_MONARCHY]: "君主に権力が集中した体制。迅速な意思決定が可能だが、正確な情報が上がってこないリスクがある。",
  [GovernmentType.CONSTITUTIONAL_MONARCHY]: "憲法により君主の権力が制限された体制。安定性と改革のバランスが取れる。",
  [GovernmentType.PARLIAMENTARY_DEMOCRACY]: "選挙で選ばれた議会が政府を組織する体制。正統性が高いが、選挙サイクルに左右される。",
  [GovernmentType.REPUBLIC]: "国民が主権者として代表者を選出する体制。理念的には最も正統だが、実際の運用は複雑。",
  [GovernmentType.ONE_PARTY_STATE]: "単一政党が統治する体制。長期計画が可能だが、腐敗が蓄積しやすい。",
  [GovernmentType.MILITARY_JUNTA]: "軍部が政権を掌握した体制。治安は安定するが経済的自由が制限される。",
  [GovernmentType.THEOCRACY]: "宗教的権威に基づく統治。イデオロギー的結束は強いが、世俗化への対応が課題。",
};

// ── Era Thresholds ──────────────────────────────────────────────────────────

export const ERA_THRESHOLDS: { maxYear: number; era: Era }[] = [
  { maxYear: 499, era: Era.ANCIENT },
  { maxYear: 799, era: Era.CLASSICAL },
  { maxYear: 1399, era: Era.FEUDAL },
  { maxYear: 1599, era: Era.EARLY_MODERN },
  { maxYear: 1799, era: Era.ENLIGHTENMENT },
  { maxYear: 1913, era: Era.IMPERIAL },
  { maxYear: 1945, era: Era.WORLD_WAR },
  { maxYear: 1991, era: Era.COLD_WAR },
  { maxYear: 2020, era: Era.GLOBALIZATION },
  { maxYear: Infinity, era: Era.MODERN },
];

export function getEraForYear(year: number): Era {
  for (const threshold of ERA_THRESHOLDS) {
    if (year <= threshold.maxYear) {
      return threshold.era;
    }
  }
  return Era.MODERN;
}

// ── Government Type Labels ──────────────────────────────────────────────────

export const GOVERNMENT_TYPE_LABELS: Record<GovernmentType, string> = {
  [GovernmentType.TRIBAL]: "部族社会",
  [GovernmentType.CHIEFDOM]: "首長制",
  [GovernmentType.MONARCHY]: "君主制",
  [GovernmentType.FEUDAL_MONARCHY]: "封建君主制",
  [GovernmentType.ABSOLUTE_MONARCHY]: "絶対君主制",
  [GovernmentType.CONSTITUTIONAL_MONARCHY]: "立憲君主制",
  [GovernmentType.PARLIAMENTARY_DEMOCRACY]: "議会制民主主義",
  [GovernmentType.REPUBLIC]: "共和制",
  [GovernmentType.ONE_PARTY_STATE]: "一党独裁制",
  [GovernmentType.MILITARY_JUNTA]: "軍事政権",
  [GovernmentType.THEOCRACY]: "神権政治",
};

// ── Era Labels ──────────────────────────────────────────────────────────────

export const ERA_LABELS: Record<Era, string> = {
  [Era.ANCIENT]: "古代・部族社会",
  [Era.CLASSICAL]: "古典古代",
  [Era.FEUDAL]: "封建時代",
  [Era.EARLY_MODERN]: "初期近代",
  [Era.ENLIGHTENMENT]: "啓蒙と革命",
  [Era.IMPERIAL]: "帝国主義時代",
  [Era.WORLD_WAR]: "世界大戦期",
  [Era.COLD_WAR]: "冷戦期",
  [Era.GLOBALIZATION]: "グローバル化時代",
  [Era.MODERN]: "現代",
};
