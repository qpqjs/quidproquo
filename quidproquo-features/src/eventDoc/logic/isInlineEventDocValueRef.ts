import { EventDocValueRef } from '../models';

/** Narrow a value ref to its inline form (no fetch needed). */
export const isInlineEventDocValueRef = (ref: EventDocValueRef): ref is Extract<EventDocValueRef, { kind: 'inline' }> => ref.kind === 'inline';
