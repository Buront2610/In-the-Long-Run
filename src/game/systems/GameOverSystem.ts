import type { GameState } from "../types";
import { NewsType } from "../types";
import { addNewsItem } from "./helpers";

export function checkGameOver(state: GameState): void {
  if (state.political.stability < 5) {
    state.gameOver = true;
    addNewsItem(state, "国家の安定が完全に崩壊しました。ゲームオーバー。", NewsType.POLITICAL);
  } else if (state.economic.debtToGdpRatio > 300) {
    state.gameOver = true;
    addNewsItem(state, "国家が財政破綻しました。ゲームオーバー。", NewsType.ECONOMIC);
  } else if (state.political.unrest > 95) {
    state.gameOver = true;
    addNewsItem(state, "全国的な反乱が発生し、政権が崩壊しました。ゲームオーバー。", NewsType.POLITICAL);
  } else if (state.economic.inflation > 50) {
    state.gameOver = true;
    addNewsItem(state, "ハイパーインフレーションにより経済が崩壊しました。ゲームオーバー。", NewsType.ECONOMIC);
  }
}
