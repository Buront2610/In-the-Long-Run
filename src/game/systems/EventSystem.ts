import type { GameState } from "../types";
import { NewsType } from "../types";
import { generateRandomEvent } from "../events";
import { addNewsItem, applyEffect, syncDebtToGdpRatio } from "./helpers";

export function generateAndPushEvent(state: GameState, rng: () => number): void {
  const event = generateRandomEvent(state.year, state, rng);
  if (event) {
    state.activeEvents.push(event);
    addNewsItem(state, `イベント発生: ${event.title}`, NewsType.POLITICAL);
  }
}

export function handleEventChoice(state: GameState, eventId: string, choiceIndex: number): void {
  const eventIndex = state.activeEvents.findIndex((e) => e.id === eventId);
  if (eventIndex === -1) return;

  const event = state.activeEvents[eventIndex];
  const choice = event.choices[choiceIndex];
  if (!choice) return;

  for (const [key, value] of Object.entries(choice.effects)) {
    applyEffect(state, key, value as number);
  }
  syncDebtToGdpRatio(state);

  addNewsItem(state, `${event.title}: ${choice.text}`, NewsType.POLITICAL);

  state.activeEvents.splice(eventIndex, 1);
}
