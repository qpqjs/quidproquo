import { Effect } from 'quidproquo-core';

import { EventDocEffect } from '../models';

/** Reserved effect: starts a new draft. Callers pass undefined; the payload is `unknown` so the stored fold shape stays the default. */
export type EventDocCreateDraftEffect = Effect<EventDocEffect.CreateDraft, unknown>;
