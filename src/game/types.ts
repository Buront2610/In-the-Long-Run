// ── Enums ──────────────────────────────────────────────────────────────────────

export enum GovernmentType {
  TRIBAL = "TRIBAL",
  CHIEFDOM = "CHIEFDOM",
  MONARCHY = "MONARCHY",
  FEUDAL_MONARCHY = "FEUDAL_MONARCHY",
  ABSOLUTE_MONARCHY = "ABSOLUTE_MONARCHY",
  CONSTITUTIONAL_MONARCHY = "CONSTITUTIONAL_MONARCHY",
  PARLIAMENTARY_DEMOCRACY = "PARLIAMENTARY_DEMOCRACY",
  REPUBLIC = "REPUBLIC",
  ONE_PARTY_STATE = "ONE_PARTY_STATE",
  MILITARY_JUNTA = "MILITARY_JUNTA",
  THEOCRACY = "THEOCRACY",
}

export enum Era {
  ANCIENT = "ANCIENT",
  CLASSICAL = "CLASSICAL",
  FEUDAL = "FEUDAL",
  EARLY_MODERN = "EARLY_MODERN",
  ENLIGHTENMENT = "ENLIGHTENMENT",
  IMPERIAL = "IMPERIAL",
  WORLD_WAR = "WORLD_WAR",
  COLD_WAR = "COLD_WAR",
  GLOBALIZATION = "GLOBALIZATION",
  MODERN = "MODERN",
}

export enum InstitutionCategory {
  POLITICAL = "POLITICAL",
  ECONOMIC = "ECONOMIC",
  SOCIAL = "SOCIAL",
  MILITARY = "MILITARY",
}

export enum InterestGroupType {
  ARISTOCRACY = "ARISTOCRACY",
  MILITARY = "MILITARY",
  CLERGY = "CLERGY",
  MERCHANTS = "MERCHANTS",
  INDUSTRIALISTS = "INDUSTRIALISTS",
  WORKERS = "WORKERS",
  FARMERS = "FARMERS",
  INTELLECTUALS = "INTELLECTUALS",
  BUREAUCRATS = "BUREAUCRATS",
}

export enum DiplomaticStatus {
  ALLIANCE = "ALLIANCE",
  FRIENDLY = "FRIENDLY",
  NEUTRAL = "NEUTRAL",
  RIVAL = "RIVAL",
  HOSTILE = "HOSTILE",
  WAR = "WAR",
}

export enum NewsType {
  POLITICAL = "POLITICAL",
  ECONOMIC = "ECONOMIC",
  SOCIAL = "SOCIAL",
  MILITARY = "MILITARY",
  DIPLOMATIC = "DIPLOMATIC",
}

// ── Spending ───────────────────────────────────────────────────────────────────

export interface SpendingCategory {
  defense: number;
  education: number;
  infrastructure: number;
  welfare: number;
  research: number;
}

// ── Economic State ─────────────────────────────────────────────────────────────

export interface EconomicState {
  gdp: number;
  gdpGrowth: number;
  population: number;
  populationGrowth: number;
  inflation: number;
  unemployment: number;
  taxRate: number;
  governmentSpending: SpendingCategory;
  debt: number;
  debtToGdpRatio: number;
  tradeBalance: number;
  giniCoefficient: number;
  treasury: number;
}

// ── Political State ────────────────────────────────────────────────────────────

export interface PoliticalState {
  governmentType: GovernmentType;
  legitimacy: number;
  corruption: number;
  stability: number;
  unrest: number;
  bureaucracyEfficiency: number;
  electionCycle: number;
  yearsSinceElection: number;
}

// ── Institutions ───────────────────────────────────────────────────────────────

export interface Institution {
  id: string;
  name: string;
  description: string;
  category: InstitutionCategory;
  adopted: boolean;
  unlockConditions: string;
  effects: Record<string, number>;
  adoptionCost: number;         // treasury cost to adopt
  stabilityImpact: number;      // stability change when adopted
  prerequisiteIds: string[];    // IDs of required institutions
  revocable: boolean;           // whether it can be removed
}

// ── Interest Groups ────────────────────────────────────────────────────────────

export interface InterestGroup {
  id: string;
  name: string;
  influence: number;
  satisfaction: number;
  demands: string[];
  type: InterestGroupType;
}

// ── Foreign Nations & Diplomacy ────────────────────────────────────────────────

export interface ForeignNation {
  id: string;
  name: string;
  governmentType: GovernmentType;
  militaryStrength: number;
  economicStrength: number;
  status: DiplomaticStatus;
  opinion: number;              // -100 to 100
  tradeAgreement: boolean;
  alliance: boolean;
}

export interface DiplomaticAction {
  id: string;
  name: string;
  description: string;
  targetNationId: string;
  cost: number;
  effects: Record<string, number>;
}

// ── Events & News ──────────────────────────────────────────────────────────────

export interface EventChoice {
  text: string;
  effects: Partial<EconomicState> & Partial<PoliticalState>;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  year: number;
  effects: Partial<EconomicState> & Partial<PoliticalState>;
  choices: EventChoice[];
  tip?: string;
}

export interface NewsItem {
  text: string;
  year: number;
  type: NewsType;
}

// ── History ────────────────────────────────────────────────────────────────────

export interface HistoryRecord {
  year: number;
  gdp: number;
  population: number;
  inflation: number;
  unemployment: number;
  stability: number;
  corruption: number;
}

// ── Tips ───────────────────────────────────────────────────────────────────────

export interface Tip {
  text: string;
  author: string;
  trigger: string;
}

// ── Policy Actions ─────────────────────────────────────────────────────────────

export interface PolicyAction {
  type: string;
  name: string;
  description: string;
  effects: Partial<EconomicState> & Partial<PoliticalState>;
}

// ── Scenarios ──────────────────────────────────────────────────────────────────

export interface Scenario {
  id: string;
  name: string;
  description: string;
  startYear: number;
  initialState: Partial<GameState>;
}

// ── Main Game State ────────────────────────────────────────────────────────────

export interface GameState {
  year: number;
  era: Era;
  nationName: string;
  economic: EconomicState;
  political: PoliticalState;
  institutions: Institution[];
  interestGroups: InterestGroup[];
  foreignNations: ForeignNation[];
  activeEvents: GameEvent[];
  news: NewsItem[];
  history: HistoryRecord[];
  tips: Tip[];
  scenario: Scenario | null;
  isPaused: boolean;
  gameOver: boolean;
}
