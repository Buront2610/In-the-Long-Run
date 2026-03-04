import type { GameState, ForeignNation } from "../types";
import { DiplomaticStatus, NewsType } from "../types";
import { clamp, addNewsItem, syncDebtToGdpRatio } from "./helpers";

export function simulateDiplomacy(state: GameState, rng: () => number): void {
  for (const nation of state.foreignNations) {
    if (nation.opinion > 0) {
      nation.opinion = clamp(nation.opinion - 1, -100, 100);
    } else if (nation.opinion < 0) {
      nation.opinion = clamp(nation.opinion + 1, -100, 100);
    }

    if (nation.governmentType === state.political.governmentType) {
      nation.opinion = clamp(nation.opinion + 1, -100, 100);
    }

    if (nation.tradeAgreement) {
      nation.opinion = clamp(nation.opinion + 1, -100, 100);
    }

    if (nation.status === DiplomaticStatus.HOSTILE && rng() < 0.1) {
      state.political.stability = clamp(state.political.stability - 2, 0, 100);
      addNewsItem(state,
        `${nation.name}が国境付近で挑発行動を行い、緊張が高まっています。`,
        NewsType.DIPLOMATIC,
      );
    }

    if (nation.alliance) {
      state.political.stability = clamp(state.political.stability + 0.5, 0, 100);
    }

    updateDiplomaticStatus(nation);
  }

  // Trade agreement benefits
  const tradePartners = state.foreignNations.filter((n) => n.tradeAgreement).length;
  if (tradePartners > 0) {
    const tradeBoost = tradePartners * 0.001 * state.economic.gdp;
    state.economic.gdp += tradeBoost;
    syncDebtToGdpRatio(state);
  }
}

export function updateDiplomaticStatus(nation: ForeignNation): void {
  if (nation.alliance) {
    nation.status = DiplomaticStatus.ALLIANCE;
  } else if (nation.opinion >= 30) {
    nation.status = DiplomaticStatus.FRIENDLY;
  } else if (nation.opinion >= -10) {
    nation.status = DiplomaticStatus.NEUTRAL;
  } else if (nation.opinion >= -40) {
    nation.status = DiplomaticStatus.RIVAL;
  } else {
    nation.status = DiplomaticStatus.HOSTILE;
  }
}

export function performDiplomaticAction(
  state: GameState,
  nationId: string,
  action: string,
): boolean {
  const nation = state.foreignNations.find((n) => n.id === nationId);
  if (!nation) return false;

  switch (action) {
    case "improve_relations": {
      if (state.economic.treasury < 10) {
        addNewsItem(state, "外交活動のための資金が不足しています。", NewsType.DIPLOMATIC);
        return false;
      }
      state.economic.treasury -= 10;
      nation.opinion = clamp(nation.opinion + 15, -100, 100);
      updateDiplomaticStatus(nation);
      addNewsItem(state,
        `${nation.name}との外交関係改善に向けた使節団を派遣しました。関係が改善しつつあります。`,
        NewsType.DIPLOMATIC,
      );
      return true;
    }
    case "trade_agreement": {
      if (nation.tradeAgreement) return false;
      if (nation.opinion < -10) {
        addNewsItem(state,
          `${nation.name}との関係が悪すぎるため、貿易協定の締結は拒否されました。`,
          NewsType.DIPLOMATIC,
        );
        return false;
      }
      if (state.economic.treasury < 15) {
        addNewsItem(state, "貿易協定締結のための資金が不足しています。", NewsType.DIPLOMATIC);
        return false;
      }
      state.economic.treasury -= 15;
      nation.tradeAgreement = true;
      nation.opinion = clamp(nation.opinion + 10, -100, 100);
      state.economic.tradeBalance += 3;
      updateDiplomaticStatus(nation);
      addNewsItem(state,
        `${nation.name}との貿易協定が締結されました。両国の交易が活発化します。`,
        NewsType.DIPLOMATIC,
      );
      return true;
    }
    case "form_alliance": {
      if (nation.alliance) return false;
      if (nation.opinion < 30) {
        addNewsItem(state,
          `${nation.name}との関係が十分でないため、同盟の提案は拒否されました。`,
          NewsType.DIPLOMATIC,
        );
        return false;
      }
      if (state.economic.treasury < 25) {
        addNewsItem(state, "同盟締結のための資金が不足しています。", NewsType.DIPLOMATIC);
        return false;
      }
      state.economic.treasury -= 25;
      nation.alliance = true;
      nation.opinion = clamp(nation.opinion + 20, -100, 100);
      nation.status = DiplomaticStatus.ALLIANCE;
      state.political.stability = clamp(state.political.stability + 3, 0, 100);
      addNewsItem(state,
        `${nation.name}と正式な同盟を締結しました。両国の安全保障が強化されます。`,
        NewsType.DIPLOMATIC,
      );
      return true;
    }
    case "denounce": {
      nation.opinion = clamp(nation.opinion - 25, -100, 100);
      updateDiplomaticStatus(nation);
      state.political.legitimacy = clamp(state.political.legitimacy + 2, 0, 100);
      for (const other of state.foreignNations) {
        if (other.id !== nationId) {
          if (other.opinion < 0) {
            other.opinion = clamp(other.opinion + 5, -100, 100);
            updateDiplomaticStatus(other);
          }
        }
      }
      addNewsItem(state,
        `${nation.name}の行為を公式に非難しました。国際社会に波紋が広がっています。`,
        NewsType.DIPLOMATIC,
      );
      return true;
    }
    case "economic_sanctions": {
      if (nation.opinion > 20) {
        addNewsItem(state,
          `${nation.name}との関係が良好なため、経済制裁は適切ではありません。`,
          NewsType.DIPLOMATIC,
        );
        return false;
      }
      nation.opinion = clamp(nation.opinion - 20, -100, 100);
      nation.tradeAgreement = false;
      nation.alliance = false;
      updateDiplomaticStatus(nation);
      state.economic.tradeBalance -= 2;
      addNewsItem(state,
        `${nation.name}に対する経済制裁を発動しました。通商関係が断絶されます。`,
        NewsType.DIPLOMATIC,
      );
      return true;
    }
    default:
      return false;
  }
}
