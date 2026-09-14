import { Effect } from 'quidproquo-core';

import { EventDocEffects } from '../../effects/EventDocEffects';
import { EventDocDocument } from '../../models';
import { EventDocEventValidator } from './EventDocEventValidator';

/**
 * Validators keyed by effect type, each typed to that effect's payload data, plus a '*' fallback for any type without
 * its own entry. Pass the module's effects union (`EventDocEventValidators<PackState, PackEffects>`) so a wrong key or a
 * rule written against another effect's data fails to compile; the reserved lifecycle effects are always addressable.
 *
 * The default `TEffects` is the untyped registry (any event type, `any` data) the fold and gate consume; a typed
 * registry is assignable to it. `any` rather than `unknown` because a rule's event parameter is contravariant.
 */
export type EventDocEventValidators<S extends EventDocDocument = EventDocDocument, TEffects extends Effect<string, any> = Effect<string, any>> = {
  [E in TEffects | EventDocEffects as E['type']]?: EventDocEventValidator<S, E['payload']>;
} & {
  '*'?: EventDocEventValidator<S>;
};
