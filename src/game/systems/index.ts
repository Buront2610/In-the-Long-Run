export { simulateEconomy } from "./EconomySystem";
export { updateInterestGroups, checkGovernmentTransition, processElectionCycle } from "./PoliticsSystem";
export { simulateDiplomacy, performDiplomaticAction, updateDiplomaticStatus } from "./DiplomacySystem";
export { generateAndPushEvent, handleEventChoice } from "./EventSystem";
export { checkGameOver } from "./GameOverSystem";
export { addNewsItem, applyEffect, syncDebtToGdpRatio, clamp } from "./helpers";
