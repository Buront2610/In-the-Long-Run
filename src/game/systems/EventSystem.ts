import type { GameState } from "../types";
import { NewsType } from "../types";
import { CHAINED_EVENTS, generateRandomEvent } from "../events";
import { addNewsItem, applyEffect, syncDebtToGdpRatio } from "./helpers";

export function generateAndPushEvent(state: GameState, rng: () => number): void {
  // Check for a pending chained event first
  if (state.pendingChainEventId) {
    const chainTemplate = CHAINED_EVENTS.find((e) => e.id === state.pendingChainEventId);
    if (chainTemplate) {
      // Consume the chain ID only after successfully locating the template
      state.pendingChainEventId = null;
      const chainEvent = {
        ...chainTemplate,
        year: state.year,
        choices: chainTemplate.choices.map((c) => ({
          text: c.text,
          effects: { ...c.effects },
        })),
        effects: { ...chainTemplate.effects },
      };
      state.activeEvents.push(chainEvent);
      addNewsItem(state, `【連鎖】イベント発生: ${chainEvent.title}`, NewsType.POLITICAL);
      return;
    }
    // Unknown chain id: discard to avoid stale state
    state.pendingChainEventId = null;
  }

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

  // Queue a chained event for next turn if this choice triggers one
  state.pendingChainEventId = choice.triggersEventId ?? null;

  state.activeEvents.splice(eventIndex, 1);
}
