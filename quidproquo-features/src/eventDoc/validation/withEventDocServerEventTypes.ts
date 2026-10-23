import { EventDocEditorValidator } from './types/EventDocEditorValidator';
import { eventDocServerEventTypeRefusal } from './eventDocServerEventTypeRefusal';

/**
 * Wraps a validator so the listed server-only event types are refused before the inner rules run. For the editor
 * pre-flight only: the backend decides the same refusal from the append's origin, so server appends are not wrapped.
 */
export const withEventDocServerEventTypes =
  (serverEventTypes: readonly string[], inner: EventDocEditorValidator): EventDocEditorValidator =>
  (event, state) =>
    serverEventTypes.includes(event.type) ? eventDocServerEventTypeRefusal(event.type) : inner(event, state);
