import { EventDocEffect } from '../models';

const reservedEffectTypes = new Set<string>(Object.values(EventDocEffect));

/** True for a reserved lifecycle effect: the event types the summary reducer folds, as opposed to a module's domain events. */
export const isEventDocReservedEffect = (type: string): boolean => reservedEffectTypes.has(type);
