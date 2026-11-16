import { buildEffectReducer, QpqReducer } from '@qpqjs/core';

import { buildEventDocBaseReducer } from '../fold/buildEventDocBaseReducer';
import { ReservedEventDocEffects } from '../fold/ReservedEventDocEffects';
import { EventDocEffect, EventDocEvent, EventDocSummaryView } from '../models';
import { createEventDocSummarySeed } from './logic/createEventDocSummarySeed';
import { createSummaryDraft } from './stateUpdaters/createSummaryDraft';
import { initSummary } from './stateUpdaters/initSummary';
import { publishSummary } from './stateUpdaters/publishSummary';

// The reserved effects every view folds (identity, status, soft delete). Cast so it accepts any EventDocEvent.
const baseReducer = buildEventDocBaseReducer<EventDocSummaryView>(createEventDocSummarySeed) as QpqReducer<EventDocSummaryView, EventDocEvent>;

// What the summary adds on top: who created the document, and its publish history.
const historyReducer = buildEffectReducer<EventDocSummaryView, ReservedEventDocEffects>({
  [EventDocEffect.InitState]: initSummary,
  [EventDocEffect.CreateDraft]: createSummaryDraft,
  [EventDocEffect.Publish]: publishSummary,
}) as QpqReducer<EventDocSummaryView, EventDocEvent>;

/**
 * The summary view's fold reducer, the same at every schema version: the base lifecycle fields, then the summary's own
 * history, then a stamp every event leaves (who last changed the document, and the event it is folded through). The
 * tail version's `eventId` advances with it, so a version's head is always its last event (the cutoff to fold or render it).
 */
export const eventDocSummaryReducer: QpqReducer<EventDocSummaryView, EventDocEvent> = (state, event) => {
  const [based, wasBaseHandled] = baseReducer(state, event);
  const [next, wasHistoryHandled] = historyReducer(based, event);
  const { eventId, createdBy } = event.payload.metadata;
  const tail = next.versions.length - 1;

  return [
    {
      ...next,
      eventId,
      updatedBy: createdBy.userId,
      versions: next.versions.map((version, index) => (index === tail ? { ...version, eventId } : version)),
    },
    wasBaseHandled || wasHistoryHandled,
  ];
};
