import { EventDocEvent, EventDocSummaryView } from '../models';
import { applyEventDocSummaryEvent } from './applyEventDocSummaryEvent';
import { createEventDocSummarySeed } from './createEventDocSummarySeed';

/** Reduce a log into the summary view from scratch. Pass the accepted events, not the raw log; `views.summary` does this. */
export const foldEventDocSummary = (events: EventDocEvent[]): EventDocSummaryView =>
  events.reduce(applyEventDocSummaryEvent, createEventDocSummarySeed());
