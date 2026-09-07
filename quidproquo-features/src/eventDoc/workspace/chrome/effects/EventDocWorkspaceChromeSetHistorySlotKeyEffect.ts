import { Effect, Nullable } from 'quidproquo-core';

import { EventDocWorkspaceChromeEffect } from './EventDocWorkspaceChromeEffect';

/** Payload of the SetHistorySlotKey effect. */
export type EventDocWorkspaceChromeSetHistorySlotKeyPayload = {
  slotKey: Nullable<string>;
};

/** Sets which slot the history panel shows. */
export type EventDocWorkspaceChromeSetHistorySlotKeyEffect = Effect<
  EventDocWorkspaceChromeEffect.SetHistorySlotKey,
  EventDocWorkspaceChromeSetHistorySlotKeyPayload
>;
