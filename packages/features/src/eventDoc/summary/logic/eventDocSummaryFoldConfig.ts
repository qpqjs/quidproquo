import { FoldEventDocLogConfig } from '../../fold/foldEventDocLog';
import { EventDocSummaryView } from '../../models';
import { eventDocSummaryReducer } from '../eventDocSummaryReducer';
import { createEventDocSummarySeed } from './createEventDocSummarySeed';

/**
 * The summary view's fold with no doc type's version history behind it: the reducer is the same at every schema
 * version, so it pins version 1 with no migrations (each event's version is clamped). What a collection with no
 * registered definition folds its summary with; a definition folds the same reducer along its own versions.
 */
export const EVENT_DOC_SUMMARY_FOLD_CONFIG: FoldEventDocLogConfig<EventDocSummaryView> = {
  seed: createEventDocSummarySeed(),
  reducer: eventDocSummaryReducer,
  migrations: {},
  latestVersion: 1,
};
