import { AskResponse, Nullable } from '@qpqjs/core';

import { EventDocEvent, EventDocSummary } from '../models';
import { askEventDocSummaryRefold } from './askEventDocSummaryRefold';
import { isEventDocReservedEffect } from './isEventDocReservedEffect';

// A reserved lifecycle event among the appended ones brings the summary row up to the last event before the
// append returns, so a reader that follows it sees it; domain events leave the row to the stream projector.
// Returns the refolded summary, or null when the row was left alone.
export function* askEventDocAppendRefold(modelId: string, events: EventDocEvent[]): AskResponse<Nullable<EventDocSummary>> {
  const lastEvent = events[events.length - 1];

  if (!lastEvent || !events.some((event) => isEventDocReservedEffect(event.type))) {
    return null;
  }

  return yield* askEventDocSummaryRefold(modelId, lastEvent.payload.metadata.eventId);
}
