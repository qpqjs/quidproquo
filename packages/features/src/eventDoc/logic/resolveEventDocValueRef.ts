import { EventDocValueRef } from '../models';
import { isInlineEventDocValueRef } from './isInlineEventDocValueRef';

/**
 * Resolve one value ref against a cache of fetched asset snapshots keyed by asset guid. `available` is separate
 * from `value` because null is a legitimate recorded value.
 */
export const resolveEventDocValueRef = (ref: EventDocValueRef, snapshots: Record<string, unknown>): { value: unknown; available: boolean } => {
  if (isInlineEventDocValueRef(ref)) {
    return { value: ref.value, available: true };
  }

  return Object.prototype.hasOwnProperty.call(snapshots, ref.guid)
    ? { value: snapshots[ref.guid], available: true }
    : { value: null, available: false };
};
