import type { InterestGroup } from "../types";
import { InterestGroupType } from "../types";

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
