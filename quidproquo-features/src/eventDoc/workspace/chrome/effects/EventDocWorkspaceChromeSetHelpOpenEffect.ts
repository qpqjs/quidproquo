import { Effect } from 'quidproquo-core';

import { EventDocWorkspaceChromeEffect } from './EventDocWorkspaceChromeEffect';

/** Payload of the SetHelpOpen effect. */
export type EventDocWorkspaceChromeSetHelpOpenPayload = {
  open: boolean;
};

/** Opens or closes the help panel. */
export type EventDocWorkspaceChromeSetHelpOpenEffect = Effect<EventDocWorkspaceChromeEffect.SetHelpOpen, EventDocWorkspaceChromeSetHelpOpenPayload>;
