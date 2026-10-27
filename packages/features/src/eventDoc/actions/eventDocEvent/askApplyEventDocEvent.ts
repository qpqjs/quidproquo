import { AskResponse, createActionRequester, Effect } from 'quidproquo-core';

import { EventDocActionType } from './EventDocActionType';

/** Payload of the ApplyEvent action. The target doc is the processor's ambient context; the processor stamps the schema version. */
export type EventDocApplyEventActionPayload = {
  eventType: string;
  data: unknown;
};

/** Untyped requester for the ApplyEvent action. Prefer askApplyEventDocEvent, which checks the data against the effect type. */
export const askApplyEventDocEventBase = createActionRequester<void>()({
  actionType: EventDocActionType.ApplyEvent,
  getPayload: (eventType: string, data: unknown) => ({ eventType, data }),
});

/**
 * Yields the ApplyEvent action for the doc bound by the enclosing processor; no default processor ships.
 * Pass the effect type explicitly, `askApplyEventDocEvent<SetTypeEffect>(Effect.SetType, data)`, so the data is checked
 * against the declared effect (a whole `{ type, payload }` object would let TS infer E from the literal).
 */
export function* askApplyEventDocEvent<E extends Effect<string, any>>(eventType: E['type'], data: E['payload']): AskResponse<void> {
  return yield* askApplyEventDocEventBase(eventType, data);
}
