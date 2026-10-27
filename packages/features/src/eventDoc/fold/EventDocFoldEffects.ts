import { Effect } from 'quidproquo-core';

import { EventDocEventPayload } from '../models/EventDocEventPayload';

/**
 * Maps a module's effect union (what action creators pass to askApplyEventDocEvent) to the shape the fold reducer
 * receives, with each effect's data wrapped in EventDocEventPayload.
 */
export type EventDocFoldEffects<TEffects extends Effect<string, any>> =
  TEffects extends Effect<infer TType, infer TData> ? Effect<TType, EventDocEventPayload<TData>> : never;
