import { EventDocEvent } from '../../models';

/** Stable empty array so an empty slot does not defeat reference-equality memoization in the selectors. */
export const noEvents: EventDocEvent[] = [];
