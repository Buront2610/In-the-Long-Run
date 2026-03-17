import type { GameState, NewsItem } from "../types";
import { NewsType } from "../types";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function addNewsItem(state: GameState, text: string, type: NewsType): void {
  const item: NewsItem = { text, year: state.year, type };
  state.news.unshift(item);
  if (state.news.length > 50) {
    state.news.length = 50;
  }
}

export function applyEffect(state: GameState, key: string, delta: number): void {
  const econ = state.economic;
  const pol = state.political;

  switch (key) {
    case "gdp":
      econ.gdp = Math.max(1, econ.gdp + delta);
      break;
    case "gdpGrowth":
      econ.gdpGrowth = clamp(econ.gdpGrowth + delta, -20, 30);
      break;
    case "population":
      econ.population = Math.max(1, econ.population + delta);
      break;
    case "populationGrowth":
      econ.populationGrowth = clamp(econ.populationGrowth + delta, -5, 10);
      break;
    case "inflation":
      econ.inflation = clamp(econ.inflation + delta, -5, 100);
      break;
    case "unemployment":
      econ.unemployment = clamp(econ.unemployment + delta, 0, 50);
      break;
    case "taxRate":
      econ.taxRate = clamp(econ.taxRate + delta, 0, 60);
      break;
    case "debt":
      econ.debt = Math.max(0, econ.debt + delta);
      break;
    case "debtToGdpRatio":
      econ.debtToGdpRatio = Math.max(0, econ.debtToGdpRatio + delta);
      break;
    case "tradeBalance":
      econ.tradeBalance += delta;
      break;
    case "giniCoefficient":
      econ.giniCoefficient = clamp(econ.giniCoefficient + delta, 0, 1);
      break;
    case "treasury":
      econ.treasury += delta;
      break;
    case "legitimacy":
      pol.legitimacy = clamp(pol.legitimacy + delta, 0, 100);
      break;
    case "corruption":
      pol.corruption = clamp(pol.corruption + delta, 0, 100);
      break;
    case "stability":
      pol.stability = clamp(pol.stability + delta, 0, 100);
      break;
    case "unrest":
      pol.unrest = clamp(pol.unrest + delta, 0, 100);
      break;
    case "bureaucracyEfficiency":
      pol.bureaucracyEfficiency = clamp(pol.bureaucracyEfficiency + delta, 0, 100);
      break;
  }
}

export function syncDebtToGdpRatio(state: GameState): void {
  const econ = state.economic;
  econ.debtToGdpRatio = econ.gdp > 0 ? (econ.debt / econ.gdp) * 100 : 0;
}
