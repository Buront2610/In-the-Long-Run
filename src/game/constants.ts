import type {
  EconomicState,
  PoliticalState,
  Institution,
  InterestGroup,
  Scenario,
} from "./types";
import {
  GovernmentType,
  Era,
  InstitutionCategory,
  InterestGroupType,
} from "./types";

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
    defense: 15,
    education: 20,
    infrastructure: 20,
    welfare: 30,
    research: 15,
  },
  debt: 500,
  debtToGdpRatio: 50,
  tradeBalance: 0,
  giniCoefficient: 0.35,
  treasury: 200,
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

// ── Initial Institutions ────────────────────────────────────────────────────

export const INITIAL_INSTITUTIONS: Institution[] = [
  // POLITICAL
  {
    id: "rule_of_law",
    name: "法の支配",
    description: "法律がすべての市民と政府機関に平等に適用される原則",
    category: InstitutionCategory.POLITICAL,
    adopted: false,
    unlockConditions: "安定度が50以上、腐敗度が50以下",
    effects: { corruption: -5, stability: 5 },
  },
  {
    id: "free_press",
    name: "報道の自由",
    description: "メディアが政府の検閲なしに情報を発信できる制度",
    category: InstitutionCategory.POLITICAL,
    adopted: false,
    unlockConditions: "正統性が60以上、法の支配が採用済み",
    effects: { corruption: -3, legitimacy: 5, unrest: 2 },
  },
  {
    id: "independent_judiciary",
    name: "司法の独立",
    description: "司法機関が行政や立法から独立して機能する制度",
    category: InstitutionCategory.POLITICAL,
    adopted: false,
    unlockConditions: "法の支配が採用済み、安定度が55以上",
    effects: { corruption: -4, stability: 3, legitimacy: 3 },
  },
  {
    id: "universal_suffrage",
    name: "普通選挙権",
    description: "すべての成人市民が選挙権を持つ制度",
    category: InstitutionCategory.POLITICAL,
    adopted: false,
    unlockConditions: "正統性が65以上、議会制民主主義または共和制",
    effects: { legitimacy: 8, unrest: -5, stability: 2 },
  },
  // ECONOMIC
  {
    id: "central_bank",
    name: "中央銀行",
    description: "通貨発行と金融政策を担う独立機関",
    category: InstitutionCategory.ECONOMIC,
    adopted: false,
    unlockConditions: "GDP が500以上、財産権の保護が採用済み",
    effects: { inflation: -2, stability: 3, gdpGrowth: 0.5 },
  },
  {
    id: "property_rights",
    name: "財産権の保護",
    description: "個人と法人の財産所有権を法的に保護する制度",
    category: InstitutionCategory.ECONOMIC,
    adopted: false,
    unlockConditions: "法の支配が採用済み",
    effects: { gdpGrowth: 1.0, corruption: -2, giniCoefficient: 0.02 },
  },
  {
    id: "free_trade",
    name: "自由貿易協定",
    description: "他国との間で関税障壁を撤廃・軽減する協定",
    category: InstitutionCategory.ECONOMIC,
    adopted: false,
    unlockConditions: "GDP が800以上、貿易収支が管理可能な範囲",
    effects: { gdpGrowth: 0.8, tradeBalance: 5, unemployment: -1 },
  },
  {
    id: "progressive_tax",
    name: "累進課税",
    description: "所得に応じて税率が段階的に上昇する課税制度",
    category: InstitutionCategory.ECONOMIC,
    adopted: false,
    unlockConditions: "官僚機構の効率が50以上",
    effects: { giniCoefficient: -0.05, treasury: 10, gdpGrowth: -0.3 },
  },
  // SOCIAL
  {
    id: "public_education",
    name: "公教育制度",
    description: "国家が提供する無償または低廉な教育制度",
    category: InstitutionCategory.SOCIAL,
    adopted: false,
    unlockConditions: "教育予算が15以上、財政に余裕がある",
    effects: { gdpGrowth: 0.5, stability: 2, corruption: -2 },
  },
  {
    id: "social_security",
    name: "社会保障制度",
    description: "国民の生活を保障する年金・医療・失業保険の制度",
    category: InstitutionCategory.SOCIAL,
    adopted: false,
    unlockConditions: "福祉予算が20以上、累進課税が採用済み",
    effects: { unrest: -5, stability: 4, giniCoefficient: -0.03 },
  },
  // MILITARY
  {
    id: "professional_army",
    name: "常備軍",
    description: "平時から維持される専門的な職業軍隊",
    category: InstitutionCategory.MILITARY,
    adopted: false,
    unlockConditions: "国防費が10以上、財政に余裕がある",
    effects: { stability: 5, unrest: -3, defense: 10 },
  },
  {
    id: "conscription",
    name: "徴兵制",
    description: "市民に軍務を義務付ける制度",
    category: InstitutionCategory.MILITARY,
    adopted: false,
    unlockConditions: "人口が30以上、正統性が50以上",
    effects: { defense: 15, unrest: 5, gdpGrowth: -0.3 },
  },
];

// ── Initial Interest Groups ─────────────────────────────────────────────────

export const INITIAL_INTEREST_GROUPS: InterestGroup[] = [
  {
    id: "aristocracy",
    name: "貴族",
    type: InterestGroupType.ARISTOCRACY,
    influence: 30,
    satisfaction: 60,
    demands: ["税率の引き下げ", "財産権の保護"],
  },
  {
    id: "military",
    name: "軍部",
    type: InterestGroupType.MILITARY,
    influence: 20,
    satisfaction: 50,
    demands: ["国防費の増額", "軍の近代化"],
  },
  {
    id: "merchants",
    name: "商人",
    type: InterestGroupType.MERCHANTS,
    influence: 25,
    satisfaction: 55,
    demands: ["自由貿易の推進", "規制の緩和"],
  },
  {
    id: "workers",
    name: "労働者",
    type: InterestGroupType.WORKERS,
    influence: 25,
    satisfaction: 40,
    demands: ["賃金の引き上げ", "労働条件の改善"],
  },
  {
    id: "farmers",
    name: "農民",
    type: InterestGroupType.FARMERS,
    influence: 15,
    satisfaction: 45,
    demands: ["農業補助金", "輸入制限"],
  },
  {
    id: "intellectuals",
    name: "知識人",
    type: InterestGroupType.INTELLECTUALS,
    influence: 15,
    satisfaction: 50,
    demands: ["教育予算の増額", "研究開発の促進"],
  },
  {
    id: "bureaucrats",
    name: "官僚",
    type: InterestGroupType.BUREAUCRATS,
    influence: 20,
    satisfaction: 55,
    demands: ["予算の拡大", "人事の安定"],
  },
];

// ── Scenarios ───────────────────────────────────────────────────────────────

export const SCENARIOS: Scenario[] = [
  {
    id: "modern_democracy",
    name: "現代民主国家",
    description:
      "安定した議会制民主主義のもと、経済成長と社会福祉のバランスを取りながら国家を運営する。",
    startYear: 2000,
    initialState: {
      economic: { ...DEFAULT_ECONOMIC_STATE },
      political: { ...DEFAULT_POLITICAL_STATE },
    },
  },
  {
    id: "emerging_nation",
    name: "新興国の挑戦",
    description:
      "独立を果たしたばかりの新興国で、急速な近代化と経済発展を目指す。",
    startYear: 1960,
    initialState: {
      economic: {
        ...DEFAULT_ECONOMIC_STATE,
        gdp: 200,
        gdpGrowth: 5.0,
        population: 30,
        populationGrowth: 2.5,
        inflation: 8.0,
        unemployment: 15.0,
        taxRate: 20,
        debt: 100,
        debtToGdpRatio: 50,
        tradeBalance: -10,
        giniCoefficient: 0.5,
        treasury: 50,
      },
      political: {
        ...DEFAULT_POLITICAL_STATE,
        governmentType: GovernmentType.ONE_PARTY_STATE,
        legitimacy: 55,
        corruption: 50,
        stability: 40,
        unrest: 35,
        bureaucracyEfficiency: 30,
        electionCycle: 0,
        yearsSinceElection: 0,
      },
    },
  },
  {
    id: "ancient_empire",
    name: "古代帝国の興亡",
    description:
      "広大な領土と大人口を持つ古代帝国を統治し、内乱や外敵から国を守る。",
    startYear: 500,
    initialState: {
      economic: {
        ...DEFAULT_ECONOMIC_STATE,
        gdp: 100,
        gdpGrowth: 0.5,
        population: 200,
        populationGrowth: 0.3,
        inflation: 1.0,
        unemployment: 10.0,
        taxRate: 25,
        debt: 30,
        debtToGdpRatio: 30,
        tradeBalance: 5,
        giniCoefficient: 0.6,
        treasury: 80,
      },
      political: {
        ...DEFAULT_POLITICAL_STATE,
        governmentType: GovernmentType.MONARCHY,
        legitimacy: 75,
        corruption: 40,
        stability: 50,
        unrest: 30,
        bureaucracyEfficiency: 35,
        electionCycle: 0,
        yearsSinceElection: 0,
      },
    },
  },
  {
    id: "reform_crisis",
    name: "体制移行の苦悩",
    description:
      "一党独裁体制の崩壊後、政治的混乱と経済危機の中で新たな国家体制を築く。",
    startYear: 1991,
    initialState: {
      economic: {
        ...DEFAULT_ECONOMIC_STATE,
        gdp: 400,
        gdpGrowth: -5.0,
        population: 80,
        populationGrowth: 0.2,
        inflation: 25.0,
        unemployment: 20.0,
        taxRate: 35,
        debt: 600,
        debtToGdpRatio: 150,
        tradeBalance: -20,
        giniCoefficient: 0.45,
        treasury: 30,
      },
      political: {
        ...DEFAULT_POLITICAL_STATE,
        governmentType: GovernmentType.ONE_PARTY_STATE,
        legitimacy: 30,
        corruption: 70,
        stability: 25,
        unrest: 60,
        bureaucracyEfficiency: 40,
        electionCycle: 0,
        yearsSinceElection: 0,
      },
    },
  },
];

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
