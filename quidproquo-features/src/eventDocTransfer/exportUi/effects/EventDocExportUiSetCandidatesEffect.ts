import { Effect } from 'quidproquo-core';

import { EventDocSummary } from '../../../eventDoc/models';
import { EventDocExportUiEffect } from './EventDocExportUiEffect';

/** Payload of SetCandidates. */
export type EventDocExportUiSetCandidatesPayload = {
  candidates: EventDocSummary[];
};

/** Stores the docs available to pick. */
export type EventDocExportUiSetCandidatesEffect = Effect<EventDocExportUiEffect.SetCandidates, EventDocExportUiSetCandidatesPayload>;
