import { Nullable, QpqIsoDateTime } from 'quidproquo-core';

import { EventDocSummary, EventDocVersion } from '../../models';
import { maxByVersion } from './maxByVersion';

/**
 * The highest version whose `effectiveFrom` is at or before `clock`, or null. Unlike publishedAsOf this keys on
 * when the publish takes effect, so a scheduled publish stays invisible until then. ISO-8601 timestamps compare as strings.
 */
export const effectiveAsOf = (model: EventDocSummary, clock: QpqIsoDateTime): Nullable<EventDocVersion> =>
  maxByVersion(model.versions.filter((version) => version.effectiveFrom !== undefined && version.effectiveFrom <= clock));
