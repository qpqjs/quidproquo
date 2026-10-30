import { AskResponse, createActionRequester } from '@qpqjs/core';

import { AdminSessionEffect } from '../effects/session/AdminSessionEffect';
import { AdminSessionActionType } from './AdminSessionActionType';

export type ApplySessionEventActionPayload = {
  type: AdminSessionEffect;
  data: unknown;
};

export const askApplySessionEventBase = createActionRequester<void>()({
  actionType: AdminSessionActionType.applyEvent,
  getPayload: (type: AdminSessionEffect, data: unknown): ApplySessionEventActionPayload => ({ type, data }),
});

// Pure: only yields the declarative ApplyEvent action, the registered
// processor decides HOW (optimistic local append + background flush).
export function* askApplySessionEvent<T>(type: AdminSessionEffect, data: T): AskResponse<void> {
  return yield* askApplySessionEventBase(type, data);
}
