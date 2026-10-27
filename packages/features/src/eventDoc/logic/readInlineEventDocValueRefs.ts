import { EventDocValueRef } from '../models';
import { isInlineEventDocValueRef } from './isInlineEventDocValueRef';

/** Split a keyed record of value refs into the inline values already in hand and the asset refs still to fetch. Pure. */
export const readInlineEventDocValueRefs = (
  refs: Record<string, EventDocValueRef>,
): {
  resolved: Record<string, unknown>;
  remote: Record<string, Extract<EventDocValueRef, { kind: 'asset' }>>;
} => {
  const resolved: Record<string, unknown> = {};
  const remote: Record<string, Extract<EventDocValueRef, { kind: 'asset' }>> = {};

  for (const [key, ref] of Object.entries(refs)) {
    if (isInlineEventDocValueRef(ref)) {
      resolved[key] = ref.value;
    } else {
      remote[key] = ref;
    }
  }

  return { resolved, remote };
};
