import { AskResponse, createActionRequester } from 'quidproquo-core';

import { AdminSessionEventType } from '../effects/session/AdminSessionEventType';
import { AdminSessionActionType } from './AdminSessionActionType';

export type ApplySessionEventActionPayload = {
  type: AdminSessionEventType;
  data: unknown;
};

export const askApplySessionEventBase = createActionRequester<void>()({
  actionType: AdminSessionActionType.applyEvent,
  getPayload: (type: AdminSessionEventType, data: unknown): ApplySessionEventActionPayload => ({ type, data }),
});

// Pure: only yields the declarative ApplyEvent action — the registered
// processor decides HOW (optimistic local append + background flush).
export function* askApplySessionEvent<T>(type: AdminSessionEventType, data: T): AskResponse<void> {
  return yield* askApplySessionEventBase(type, data);
}
