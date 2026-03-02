import type { GameEvent, GameState } from "./types";

// ── Random Event Templates ──────────────────────────────────────────────────

export const RANDOM_EVENTS: GameEvent[] = [
  // Natural disasters
  {
    id: "earthquake",
    title: "大地震",
    description: "大規模な地震が国土を襲い、甚大な被害をもたらしました。",
    year: 0,
    effects: { gdpGrowth: -3, stability: -10 },
    choices: [
      {
        text: "大規模な復興予算を投入する",
        effects: { treasury: -50, stability: 5, gdpGrowth: 1 },
      },
      {
        text: "国際社会に支援を要請する",
        effects: { treasury: -20, legitimacy: -5, stability: 3 },
      },
      {
        text: "被災地の自助努力に委ねる",
        effects: { unrest: 10, stability: -5 },
      },
    ],
    tip: "災害対応は政権の正統性を左右する重大な局面です。",
  },
  {
    id: "flood",
    title: "大洪水",
    description: "河川の氾濫により広範囲が浸水し、農業生産に深刻な影響が出ています。",
    year: 0,
    effects: { gdpGrowth: -2, populationGrowth: -0.5 },
    choices: [
      {
        text: "治水インフラに緊急投資する",
        effects: { treasury: -40, gdpGrowth: 1, stability: 3 },
      },
      {
        text: "被災農家に補助金を支給する",
        effects: { treasury: -25, unrest: -5 },
      },
    ],
    tip: "インフラ投資は短期的な出費だが、長期的な安定につながります。",
  },
  {
    id: "drought",
    title: "干ばつ",
    description: "長期的な干ばつにより食糧生産が激減し、食料価格が高騰しています。",
    year: 0,
    effects: { inflation: 3, unrest: 8 },
    choices: [
      {
        text: "食糧を緊急輸入する",
        effects: { treasury: -30, tradeBalance: -10, unrest: -5 },
      },
      {
        text: "食糧の配給制を導入する",
        effects: { unrest: -3, legitimacy: -5, corruption: 3 },
      },
    ],
    tip: "食糧危機は革命の引き金になりうる最も危険な事態の一つです。",
  },
  {
    id: "plague",
    title: "疫病の流行",
    description:
      "致死的な疫病が国中に広がり、人口と経済に壊滅的な影響を及ぼしています。",
    year: 0,
    effects: { populationGrowth: -2, gdpGrowth: -4, unrest: 10 },
    choices: [
      {
        text: "厳格な隔離政策を実施する",
        effects: {
          gdpGrowth: -2,
          populationGrowth: 0.5,
          stability: -3,
          unrest: 5,
        },
      },
      {
        text: "医療研究に大規模投資する",
        effects: { treasury: -60, populationGrowth: 1, legitimacy: 5 },
      },
      {
        text: "経済活動を優先し制限を最小化する",
        effects: { populationGrowth: -1, gdpGrowth: 1, unrest: 8 },
      },
    ],
    tip: "疫病対策は公衆衛生と経済のトレードオフを鋭く突きつけます。",
  },
  // Political
  {
    id: "charismatic_leader",
    title: "カリスマ的指導者の登場",
    description:
      "国民的人気を誇る新たな指導者が台頭し、政治情勢が大きく変わろうとしています。",
    year: 0,
    effects: { legitimacy: 5, stability: 3 },
    choices: [
      {
        text: "改革の同志として迎え入れる",
        effects: { legitimacy: 10, stability: 5, corruption: -5 },
      },
      {
        text: "政治的脅威として警戒する",
        effects: { stability: -3, unrest: 5, corruption: 2 },
      },
    ],
    tip: "カリスマ的指導者は希望にも脅威にもなりうる両刃の剣です。",
  },
  {
    id: "political_scandal",
    title: "政治スキャンダル",
    description:
      "政権中枢の大規模な汚職が発覚し、国民の信頼が大きく揺らいでいます。",
    year: 0,
    effects: { legitimacy: -10, corruption: 5, unrest: 8 },
    choices: [
      {
        text: "徹底的な調査と粛清を行う",
        effects: { corruption: -10, stability: -5, legitimacy: 5 },
      },
      {
        text: "穏便に処理し沈静化を図る",
        effects: { corruption: 3, stability: 2, legitimacy: -5 },
      },
      {
        text: "制度改革で再発防止に取り組む",
        effects: {
          corruption: -5,
          bureaucracyEfficiency: 5,
          treasury: -15,
        },
      },
    ],
    tip: "腐敗は制度が弱体化した隙間に生まれます。",
  },
  {
    id: "civil_revolution_threat",
    title: "市民革命の危機",
    description:
      "広範な市民層が現体制への不満を爆発させ、革命の機運が高まっています。",
    year: 0,
    effects: { unrest: 15, stability: -10 },
    choices: [
      {
        text: "民主的改革を約束し対話する",
        effects: { legitimacy: 8, unrest: -10, stability: 5 },
      },
      {
        text: "武力で鎮圧する",
        effects: { unrest: -8, stability: 5, legitimacy: -15, corruption: 5 },
      },
    ],
    tip: "革命は抑え込めても、その根本原因は残り続けます。",
  },
  // Economic
  {
    id: "resource_discovery",
    title: "資源の発見",
    description:
      "国内で大規模な天然資源が発見され、経済発展の好機が訪れています。",
    year: 0,
    effects: { gdpGrowth: 2, treasury: 30 },
    choices: [
      {
        text: "国有化して国家収入に充てる",
        effects: { treasury: 50, corruption: 5, gdpGrowth: 1 },
      },
      {
        text: "民間企業に開発を委ねる",
        effects: {
          gdpGrowth: 2,
          giniCoefficient: 0.03,
          unemployment: -2,
        },
      },
      {
        text: "国際共同開発とする",
        effects: { tradeBalance: 10, gdpGrowth: 1.5, legitimacy: 3 },
      },
    ],
    tip: "「資源の呪い」—天然資源の富は適切な制度なしには腐敗を生みます。",
  },
  {
    id: "tech_innovation",
    title: "技術革新",
    description:
      "画期的な技術革新により産業構造が変化し、新たな経済機会が生まれています。",
    year: 0,
    effects: { gdpGrowth: 3, unemployment: 3 },
    choices: [
      {
        text: "技術導入を積極的に支援する",
        effects: { gdpGrowth: 2, unemployment: -1, treasury: -20 },
      },
      {
        text: "既存産業の保護を優先する",
        effects: { gdpGrowth: -1, unemployment: -2, stability: 3 },
      },
    ],
    tip: "シュンペーターの「創造的破壊」—革新は古い秩序を破壊して新しい成長を生む。",
  },
  {
    id: "bubble_burst",
    title: "バブル崩壊",
    description: "投機的に膨れ上がった資産価格が崩壊し、金融危機が発生しています。",
    year: 0,
    effects: { gdpGrowth: -5, unemployment: 5, treasury: -40 },
    choices: [
      {
        text: "大規模な財政出動で景気を刺激する",
        effects: { treasury: -60, gdpGrowth: 2, debt: 50 },
      },
      {
        text: "市場の自律回復を待つ",
        effects: { unemployment: 3, unrest: 10, gdpGrowth: -2 },
      },
      {
        text: "金融規制を強化する",
        effects: { gdpGrowth: -1, stability: 5, corruption: -3 },
      },
    ],
    tip: "ミンスキー：安定は不安定を生む。繁栄の中にこそ危機の種がある。",
  },
  {
    id: "trade_route_change",
    title: "貿易路の変化",
    description:
      "国際的な貿易路が変化し、交易パターンに大きな影響が出ています。",
    year: 0,
    effects: { tradeBalance: -5, gdpGrowth: -1 },
    choices: [
      {
        text: "新たな貿易相手国を開拓する",
        effects: { tradeBalance: 8, treasury: -15, gdpGrowth: 1 },
      },
      {
        text: "国内産業の育成に切り替える",
        effects: { gdpGrowth: 0.5, tradeBalance: 3, unemployment: -2 },
      },
    ],
    tip: "グローバル経済では、外部環境の変化への適応力が生存を左右します。",
  },
  // Social
  {
    id: "population_boom",
    title: "人口急増",
    description:
      "急激な人口増加により、雇用・住居・食糧への圧力が高まっています。",
    year: 0,
    effects: { populationGrowth: 2, unemployment: 3, unrest: 5 },
    choices: [
      {
        text: "都市インフラを大規模に拡張する",
        effects: { treasury: -40, unemployment: -2, stability: 3 },
      },
      {
        text: "移民政策を制限する",
        effects: { populationGrowth: -1, unrest: -3, gdpGrowth: -0.5 },
      },
    ],
    tip: "人口は国力の源泉であると同時に、管理を誤れば不安定の元凶となります。",
  },
  {
    id: "education_reform",
    title: "教育改革運動",
    description: "知識人と市民が教育制度の抜本的改革を求めて運動を展開しています。",
    year: 0,
    effects: { unrest: 3, legitimacy: -3 },
    choices: [
      {
        text: "包括的な教育改革を実施する",
        effects: { treasury: -30, gdpGrowth: 0.5, legitimacy: 5, unrest: -5 },
      },
      {
        text: "段階的な改善に留める",
        effects: { treasury: -10, unrest: -2 },
      },
    ],
    tip: "教育への投資は最も確実な長期的成長戦略の一つです。",
  },
  {
    id: "labor_strike",
    title: "労働者ストライキ",
    description:
      "主要産業の労働者が大規模なストライキを敢行し、経済活動が停滞しています。",
    year: 0,
    effects: { gdpGrowth: -2, unrest: 8 },
    choices: [
      {
        text: "労働者の要求を受け入れる",
        effects: {
          gdpGrowth: -0.5,
          unrest: -10,
          giniCoefficient: -0.02,
          treasury: -15,
        },
      },
      {
        text: "交渉で妥協点を探る",
        effects: { unrest: -5, stability: 2 },
      },
      {
        text: "ストライキを違法化し弾圧する",
        effects: { unrest: 5, stability: 3, legitimacy: -8 },
      },
    ],
    tip: "労使関係は社会の安定を映す鏡です。",
  },
  // Diplomatic
  {
    id: "military_threat",
    title: "隣国の軍事的脅威",
    description:
      "隣国が軍事的な挑発行動を強め、安全保障上の緊張が高まっています。",
    year: 0,
    effects: { stability: -5, unrest: 5 },
    choices: [
      {
        text: "軍備を増強し抑止力を高める",
        effects: { treasury: -40, stability: 5, unrest: -3, gdpGrowth: -0.5 },
      },
      {
        text: "外交交渉による解決を目指す",
        effects: { stability: 3, legitimacy: 3, unrest: -2 },
      },
      {
        text: "国際社会に仲裁を求める",
        effects: { legitimacy: 2, stability: 2 },
      },
    ],
    tip: "クラウゼヴィッツ：戦争は他の手段をもってする政治の延長である。",
  },
];

// ── Event Generator ─────────────────────────────────────────────────────────

export function generateRandomEvent(
  year: number,
  state: GameState,
): GameEvent | null {
  // ~30% chance of an event each turn
  if (Math.random() > 0.3) {
    return null;
  }

  // Filter events by relevance to current state
  const candidates = RANDOM_EVENTS.filter((e) => {
    if (e.id === "bubble_burst" && state.economic.gdpGrowth < 0) return false;
    if (e.id === "labor_strike" && state.economic.unemployment > 20)
      return false;
    if (
      e.id === "resource_discovery" &&
      state.economic.gdpGrowth > 8
    )
      return false;
    return true;
  });

  if (candidates.length === 0) return null;

  const template = candidates[Math.floor(Math.random() * candidates.length)];

  return {
    ...template,
    year,
    // Deep copy choices so runtime mutations don't affect templates
    choices: template.choices.map((c) => ({
      text: c.text,
      effects: { ...c.effects },
    })),
    effects: { ...template.effects },
  };
}
