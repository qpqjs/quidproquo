import { Effect } from 'quidproquo-core';

import { EventDocWorkspaceChromeEffect } from './EventDocWorkspaceChromeEffect';

/** Payload of the SetHistoryOpen effect. */
export type EventDocWorkspaceChromeSetHistoryOpenPayload = {
  open: boolean;
};

/** Opens or closes the history panel. */
export type EventDocWorkspaceChromeSetHistoryOpenEffect = Effect<
  EventDocWorkspaceChromeEffect.SetHistoryOpen,
  EventDocWorkspaceChromeSetHistoryOpenPayload
>;
