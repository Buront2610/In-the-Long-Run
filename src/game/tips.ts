import type { GameState, Tip } from "./types";

// ── Tips / Economist Quotes ─────────────────────────────────────────────────

export const TIPS: Tip[] = [
  {
    text: "長期的には、我々はみな死んでいる。",
    author: "ケインズ (Keynes)",
    trigger: "unemployment_high",
  },
  {
    text: "インフレーションはいつでもどこでも貨幣的現象である。",
    author: "フリードマン (Friedman)",
    trigger: "inflation_high",
  },
  {
    text: "小さな集団は大きな集団よりも効果的に集合行為を組織できる。これが利益団体政治の本質である。",
    author: "オルソン (Olson)",
    trigger: "corruption_high",
  },
  {
    text: "官僚は自らの予算を最大化しようとする合理的行為者である。",
    author: "ニスカネン (Niskanen)",
    trigger: "bureaucracy_bloat",
  },
  {
    text: "安定は不安定を生む。長期の繁栄は過剰なリスクテイクを招く。",
    author: "ミンスキー (Minsky)",
    trigger: "bubble_burst",
  },
  {
    text: "資本収益率が経済成長率を上回り続ける限り、格差は拡大し続ける。",
    author: "ピケティ (Piketty)",
    trigger: "inequality_high",
  },
  {
    text: "国家の繁栄を決定するのは地理でも文化でもなく、包摂的な制度である。",
    author: "アセモグル (Acemoglu)",
    trigger: "institutions_weak",
  },
  {
    text: "創造的破壊こそが資本主義の本質的事実である。",
    author: "シュンペーター (Schumpeter)",
    trigger: "tech_change",
  },
  {
    text: "戦争は他の手段をもってする政治の延長である。",
    author: "クラウゼヴィッツ (Clausewitz)",
    trigger: "military_threat",
  },
  {
    text: "改革者は旧秩序の受益者を敵に回し、新秩序の受益者からはぬるい支持しか得られない。",
    author: "マキャヴェッリ (Machiavelli)",
    trigger: "stability_low",
  },
  {
    text: "民主主義は最悪の政治形態である。ただし、これまで試みられた他のすべての形態を除けば。",
    author: "チャーチル (Churchill)",
    trigger: "democracy_crisis",
  },
  {
    text: "個人が自らの利益を追求することで、社会全体の利益が見えざる手によって促進される。",
    author: "スミス (Adam Smith)",
    trigger: "free_market",
  },
  {
    text: "知識の分散性こそが中央計画の根本的限界である。",
    author: "ハイエク (Hayek)",
    trigger: "planning_failure",
  },
  {
    text: "制度とは社会におけるゲームのルールであり、人間の相互作用を形づくる制約である。",
    author: "ノース (North)",
    trigger: "institution_change",
  },
  {
    text: "経済学を学ぶ目的は、経済学者に騙されないようにすることである。",
    author: "ロビンソン (Joan Robinson)",
    trigger: "policy_warning",
  },
];

// ── Get Relevant Tips ───────────────────────────────────────────────────────

export function getRelevantTips(state: GameState): Tip[] {
  const matched: Tip[] = [];

  for (const tip of TIPS) {
    switch (tip.trigger) {
      case "unemployment_high":
        if (state.economic.unemployment > 15) matched.push(tip);
        break;
      case "inflation_high":
        if (state.economic.inflation > 10) matched.push(tip);
        break;
      case "corruption_high":
        if (state.political.corruption > 60) matched.push(tip);
        break;
      case "bureaucracy_bloat":
        if (state.political.bureaucracyEfficiency < 30) matched.push(tip);
        break;
      case "bubble_burst":
        if (state.economic.gdpGrowth < -3) matched.push(tip);
        break;
      case "inequality_high":
        if (state.economic.giniCoefficient > 0.5) matched.push(tip);
        break;
      case "institutions_weak":
        if (
          state.institutions.filter((i) => i.adopted).length <
          state.institutions.length * 0.25
        )
          matched.push(tip);
        break;
      case "tech_change":
        if (state.economic.gdpGrowth > 5) matched.push(tip);
        break;
      case "military_threat":
        if (state.political.unrest > 50 && state.political.stability < 40)
          matched.push(tip);
        break;
      case "stability_low":
        if (state.political.stability < 30) matched.push(tip);
        break;
      case "democracy_crisis":
        if (state.political.legitimacy < 30 && state.political.unrest > 50)
          matched.push(tip);
        break;
      case "free_market":
        if (state.economic.taxRate < 20 && state.economic.gdpGrowth > 3)
          matched.push(tip);
        break;
      case "planning_failure":
        if (
          state.economic.gdpGrowth < -2 &&
          state.political.bureaucracyEfficiency < 40
        )
          matched.push(tip);
        break;
      case "institution_change":
        if (state.institutions.some((i) => i.adopted)) matched.push(tip);
        break;
      case "policy_warning":
        if (state.economic.debtToGdpRatio > 100) matched.push(tip);
        break;
    }
  }

  return matched;
}
