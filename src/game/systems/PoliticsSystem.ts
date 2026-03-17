import type { GameState } from "../types";
import { GovernmentType, NewsType } from "../types";
import { GOVERNMENT_TYPE_LABELS } from "../constants";
import { clamp, addNewsItem } from "./helpers";

export function updateInterestGroups(state: GameState): void {
  const s = state;

  for (const ig of s.interestGroups) {
    switch (ig.type) {
      case "ARISTOCRACY":
        ig.satisfaction = clamp(
          ig.satisfaction + (s.economic.taxRate < 25 ? 2 : -2),
          0,
          100,
        );
        break;
      case "MILITARY":
        ig.satisfaction = clamp(
          ig.satisfaction +
            (s.economic.governmentSpending.defense > 4 ? 2 : -2),
          0,
          100,
        );
        break;
      case "MERCHANTS":
        ig.satisfaction = clamp(
          ig.satisfaction + (s.economic.tradeBalance > 0 ? 2 : -1),
          0,
          100,
        );
        break;
      case "WORKERS":
        ig.satisfaction = clamp(
          ig.satisfaction +
            (s.economic.governmentSpending.welfare > 12 ? 2 : -2) +
            (s.economic.unemployment < 8 ? 1 : -1),
          0,
          100,
        );
        break;
      case "FARMERS":
        ig.satisfaction = clamp(
          ig.satisfaction + (s.economic.inflation < 5 ? 1 : -2),
          0,
          100,
        );
        break;
      case "INTELLECTUALS":
        ig.satisfaction = clamp(
          ig.satisfaction +
            (s.economic.governmentSpending.education +
              s.economic.governmentSpending.research >
            8
              ? 2
              : -2),
          0,
          100,
        );
        break;
      case "BUREAUCRATS":
        ig.satisfaction = clamp(
          ig.satisfaction + (s.political.stability > 50 ? 1 : -1),
          0,
          100,
        );
        break;
    }

    if (ig.satisfaction < 30) {
      s.political.unrest = clamp(
        s.political.unrest + ig.influence * 0.1,
        0,
        100,
      );
    }
  }
}

export function checkGovernmentTransition(state: GameState, rng: () => number): void {
  const pol = state.political;
  const gt = pol.governmentType;

  if (pol.unrest > 80 && pol.stability < 20 && rng() < 0.3) {
    if (gt === GovernmentType.ABSOLUTE_MONARCHY || gt === GovernmentType.MONARCHY || gt === GovernmentType.FEUDAL_MONARCHY) {
      if (pol.legitimacy > 30) {
        transitionGovernment(state, GovernmentType.REPUBLIC,
          "大規模な市民蜂起により王制が打倒されました。市民は共和制の樹立を宣言し、新たな時代の幕が開きました。「旧体制（アンシャン・レジーム）は終わった」の声が街頭に響いています。");
      } else {
        transitionGovernment(state, GovernmentType.MILITARY_JUNTA,
          "王制の崩壊後、軍部が秩序維持を名目に権力を掌握しました。「我々は国家を救うために介入する」と将軍が宣言しています。民主化への道筋は不透明です。");
      }
      return;
    }
    if (gt === GovernmentType.ONE_PARTY_STATE) {
      transitionGovernment(state, GovernmentType.REPUBLIC,
        "一党独裁体制に対する不満が爆発し、民主化運動が体制を打倒しました。広場を埋め尽くす市民の歓声が新時代の到来を告げています。しかし、真の民主主義の構築はここからが本番です。");
      return;
    }
  }

  const militaryGroup = state.interestGroups.find((ig) => ig.type === "MILITARY");
  if (
    militaryGroup &&
    militaryGroup.satisfaction < 25 &&
    pol.stability < 30 &&
    gt !== GovernmentType.MILITARY_JUNTA &&
    rng() < 0.15
  ) {
    transitionGovernment(state, GovernmentType.MILITARY_JUNTA,
      "軍部がクーデターを決行し、政権を掌握しました。「国家の危機に際し、軍は行動する義務がある」と声明を発表。戒厳令が布告され、議会活動が停止されました。");
    return;
  }

  if (
    pol.legitimacy > 70 &&
    pol.corruption < 40 &&
    state.economic.gdp > 500 &&
    (gt === GovernmentType.ABSOLUTE_MONARCHY || gt === GovernmentType.CONSTITUTIONAL_MONARCHY) &&
    rng() < 0.1
  ) {
    transitionGovernment(state, GovernmentType.PARLIAMENTARY_DEMOCRACY,
      "国内外の民主化圧力が頂点に達し、議会制民主主義への平和的移行が実現しました。「これは革命ではない。進化である」と改革派指導者は語りました。歴史は静かに、しかし確実に前進しています。");
    return;
  }

  if (
    gt === GovernmentType.ABSOLUTE_MONARCHY &&
    pol.unrest > 50 &&
    pol.legitimacy > 40 &&
    rng() < 0.1
  ) {
    transitionGovernment(state, GovernmentType.CONSTITUTIONAL_MONARCHY,
      "議会の権限を拡大する憲法改正が行われ、立憲君主制へ移行しました。君主は「朕は国民と共に歩む」と宣言。権力は維持しつつも、その行使は制限されることになりました。");
    return;
  }

  if (gt === GovernmentType.MILITARY_JUNTA && pol.stability > 60 && rng() < 0.08) {
    if (pol.legitimacy > 50) {
      transitionGovernment(state, GovernmentType.PARLIAMENTARY_DEMOCRACY,
        "軍政が「民政移管」を宣言し、自由選挙が実施されました。長い軍事支配の後、市民は投票所に列を成しています。真の民主主義への道のりは始まったばかりです。");
    } else {
      transitionGovernment(state, GovernmentType.ONE_PARTY_STATE,
        "軍部が「指導政党」を結成し、形式的な選挙を経て一党支配体制に移行しました。「安定のためには強い指導力が必要だ」と将軍は説明しています。");
    }
    return;
  }

  // Theocracy → Constitutional Monarchy through education and reform
  if (
    gt === GovernmentType.THEOCRACY &&
    state.economic.governmentSpending.education > 5 &&
    pol.legitimacy > 60 &&
    pol.stability > 40 &&
    rng() < 0.08
  ) {
    transitionGovernment(state, GovernmentType.CONSTITUTIONAL_MONARCHY,
      "宗教的指導者たちの間で改革派が台頭し、世俗的な統治機構との権力共有が実現しました。「信仰と理性は共存できる」という新たな合意が形成されつつあります。");
    return;
  }

  // Republic/Democracy → One-Party State (democratic backsliding)
  if (
    (gt === GovernmentType.REPUBLIC || gt === GovernmentType.PARLIAMENTARY_DEMOCRACY) &&
    pol.corruption > 70 &&
    pol.stability < 35 &&
    pol.legitimacy < 40 &&
    rng() < 0.1
  ) {
    transitionGovernment(state, GovernmentType.ONE_PARTY_STATE,
      "民主主義の機能不全と蔓延する腐敗に幻滅した国民が、「強い指導者」を求める声に呼応しました。選挙は形骸化し、事実上の一党支配体制が確立されています。民主主義の後退は静かに、しかし確実に進行しました。");
    return;
  }

  // Tribal/Chiefdom → Monarchy (state formation)
  if (
    (gt === GovernmentType.TRIBAL || gt === GovernmentType.CHIEFDOM) &&
    state.economic.gdp > 80 &&
    pol.stability > 40 &&
    rng() < 0.12
  ) {
    transitionGovernment(state, GovernmentType.MONARCHY,
      "有力な首長が周辺部族を統合し、世襲制の王朝を樹立しました。「一つの民、一人の王」の旗印のもと、より組織的な国家体制が形成されつつあります。");
    return;
  }

  // Monarchy → Absolute Monarchy (power centralization)
  if (
    gt === GovernmentType.MONARCHY &&
    pol.legitimacy > 65 &&
    pol.corruption < 50 &&
    state.economic.treasury > 100 &&
    rng() < 0.08
  ) {
    transitionGovernment(state, GovernmentType.ABSOLUTE_MONARCHY,
      "君主が貴族勢力を抑え込み、中央集権的な統治体制を確立しました。「朕は国家なり」の宣言が象徴するように、すべての権力が王座に集中しています。");
    return;
  }
}

function transitionGovernment(state: GameState, newType: GovernmentType, description: string): void {
  const oldType = state.political.governmentType;
  state.political.governmentType = newType;

  state.political.stability = clamp(state.political.stability - 15, 0, 100);
  state.political.unrest = clamp(state.political.unrest - 10, 0, 100);
  state.political.yearsSinceElection = 0;

  switch (newType) {
    case GovernmentType.PARLIAMENTARY_DEMOCRACY:
    case GovernmentType.REPUBLIC:
      state.political.electionCycle = 4;
      break;
    case GovernmentType.CONSTITUTIONAL_MONARCHY:
      state.political.electionCycle = 5;
      break;
    default:
      state.political.electionCycle = 0;
  }

  const oldLabel = GOVERNMENT_TYPE_LABELS[oldType];
  const newLabel = GOVERNMENT_TYPE_LABELS[newType];
  addNewsItem(state,
    `【体制変革】${oldLabel}から${newLabel}へ移行: ${description}`,
    NewsType.POLITICAL,
  );
}

export function processElectionCycle(state: GameState): void {
  const pol = state.political;

  if (pol.electionCycle > 0) {
    pol.yearsSinceElection += 1;
    if (pol.yearsSinceElection >= pol.electionCycle) {
      pol.yearsSinceElection = 0;
      const approvalBonus = state.economic.gdpGrowth > 2 ? 3 : state.economic.gdpGrowth > 0 ? 1 : -5;
      const unrestPenalty = pol.unrest > 50 ? -5 : pol.unrest > 30 ? -2 : 0;
      pol.legitimacy = clamp(
        pol.legitimacy + 5 + approvalBonus + unrestPenalty,
        0,
        100,
      );
      if (state.economic.gdpGrowth > 2 && pol.unrest < 30) {
        addNewsItem(state, "選挙が実施され、現政権が信任を得ました。好調な経済が支持率を押し上げています。", NewsType.POLITICAL);
      } else if (pol.unrest > 50 || state.economic.gdpGrowth < 0) {
        addNewsItem(state, "選挙が実施されました。不満を持つ有権者の投票行動が政治地図を塗り替えつつあります。", NewsType.POLITICAL);
      } else {
        addNewsItem(state, "選挙が実施されました。国民は政権に対して慎重な判断を下しました。", NewsType.POLITICAL);
      }
    }
  }
}
