import { buildEffectReducer, QpqReducer } from 'quidproquo-core';

import { ReservedEventDocEffects } from '../fold/ReservedEventDocEffects';
import { EventDocEffect, EventDocEvent, EventDocSummaryView } from '../models';
import { createSummaryDraft } from './stateUpdaters/createSummaryDraft';
import { deleteSummary } from './stateUpdaters/deleteSummary';
import { initSummary } from './stateUpdaters/initSummary';
import { publishSummary } from './stateUpdaters/publishSummary';
import { restoreSummary } from './stateUpdaters/restoreSummary';
import { setSummaryCode } from './stateUpdaters/setSummaryCode';
import { setSummaryName } from './stateUpdaters/setSummaryName';

/** Folds the reserved events into the summary; domain events bubble unhandled. Cast so it accepts any EventDocEvent. */
export const eventDocSummaryReducer = buildEffectReducer<EventDocSummaryView, ReservedEventDocEffects>({
  [EventDocEffect.InitState]: initSummary,
  [EventDocEffect.SetCode]: setSummaryCode,
  [EventDocEffect.SetName]: setSummaryName,
  [EventDocEffect.CreateDraft]: createSummaryDraft,
  [EventDocEffect.Publish]: publishSummary,
  [EventDocEffect.Delete]: deleteSummary,
  [EventDocEffect.Restore]: restoreSummary,
}) as QpqReducer<EventDocSummaryView, EventDocEvent>;
