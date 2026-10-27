import { EventDocEvent } from './EventDocEvent';
import { EventDocSummary } from './EventDocSummary';

/**
 * Input to a collection's `onPublish` function after a Publish event is durably appended. `state` and `previousState` are
 * the folded document as of this event and the one before; the hook narrows them to its document type.
 */
export type EventDocOnPublishInput = {
  docId: string;
  event: EventDocEvent;
  summary: EventDocSummary;
  state: unknown;
  previousState: unknown;
};
