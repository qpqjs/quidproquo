import { AskResponse, createActionRequester, Effect } from 'quidproquo-core';

import { EventDocActionType } from './EventDocActionType';

/** Payload of the ApplyTransientEvent action. The target doc is the processor's ambient context. */
export type EventDocApplyTransientEventActionPayload = {
  // Names the drop unit (usually a websocket connection id); a drop clears every transient event under it.
  transientKey: string;
  eventType: string;
  data: unknown;
};

/** Untyped requester for the ApplyTransientEvent action. Prefer askApplyTransientEventDocEvent. */
export const askApplyTransientEventDocEventBase = createActionRequester<void>()({
  actionType: EventDocActionType.ApplyTransientEvent,
  getPayload: (transientKey: string, eventType: string, data: unknown) => ({ transientKey, eventType, data }),
});

/**
 * Never-saved sibling of askApplyEventDocEvent: the event lands in the bound slot's transient group under `transientKey`
 * and is dropped wholesale, never persisted. Client runtime only; an unbound apply fails loudly.
 * Pass the effect type explicitly so the data is checked against the declared effect.
 */
export function* askApplyTransientEventDocEvent<E extends Effect<string, any>>(
  transientKey: string,
  eventType: E['type'],
  data: E['payload'],
): AskResponse<void> {
  return yield* askApplyTransientEventDocEventBase(transientKey, eventType, data);
}
