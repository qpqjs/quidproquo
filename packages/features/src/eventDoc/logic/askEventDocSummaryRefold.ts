import { askCatch, askLogCreate, AskResponse, LogLevelEnum, Nullable } from '@qpqjs/core';

import { askEventDocStoreReadOrThrow } from '../context/askEventDocStoreReadOrThrow';
import { askEventDocEventListAll } from '../data/askEventDocEventListAll';
import { askEventDocGetById } from '../data/askEventDocGetById';
import { askEventDocSummaryViewWrite } from '../data/askEventDocSummaryViewWrite';
import { EventDocSummary, EventDocSummaryView } from '../models';
import { applyEventDocSummaryEvent } from '../summary/logic/applyEventDocSummaryEvent';
import { foldEventDocSummary } from '../summary/logic/foldEventDocSummary';

// The stored row carried through the events after it, up to `eventId`. From the whole log when there is no row to carry,
// or one from before the view said where it was up to. A row already at or past the event is returned as it is.
function* askSummaryViewUpTo(modelId: string, eventId: number): AskResponse<EventDocSummaryView> {
  const row = yield* askEventDocGetById(modelId, { consistentRead: true });
  const base = row && (row as Partial<EventDocSummary>).eventId !== undefined ? row : null;

  if (base && base.eventId >= eventId) {
    return base;
  }

  const events = yield* askEventDocEventListAll(modelId, { afterEventId: base?.eventId, upToEventId: eventId, consistentRead: true });

  return base ? events.reduce<EventDocSummaryView>(applyEventDocSummaryEvent, base) : foldEventDocSummary(events);
}

function* askRefoldAndWrite(modelId: string, eventId: number): AskResponse<EventDocSummaryView> {
  const view = yield* askSummaryViewUpTo(modelId, eventId);

  yield* askEventDocSummaryViewWrite(modelId, view);

  return view;
}

/**
 * Bring the summary row up to an event the caller has just appended, in process and through the summary reducer alone,
 * so a reader that follows the append sees the lifecycle change rather than the row the stream projector has yet to
 * rebuild. Never throws: the event is already durable, so a failure here is logged and left to the projector, and a
 * client retry of a failed append would only double-append. Returns the summary as written, or null when it was not.
 */
export function* askEventDocSummaryRefold(modelId: string, eventId: number): AskResponse<Nullable<EventDocSummary>> {
  const { type } = yield* askEventDocStoreReadOrThrow();

  const refolded = yield* askCatch(askRefoldAndWrite(modelId, eventId));

  if (!refolded.success) {
    yield* askLogCreate(
      LogLevelEnum.Warn,
      `Could not refold the summary of ${modelId} after appending event ${eventId}; the stream projector will.`,
      refolded.error,
    );

    return null;
  }

  return { ...refolded.result, type };
}
