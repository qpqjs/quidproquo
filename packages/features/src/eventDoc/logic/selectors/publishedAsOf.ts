import { Nullable, QpqIsoDateTime } from 'quidproquo-core';

import { EventDocSummary, EventDocVersion } from '../../models';
import { maxByVersion } from './maxByVersion';

/** The highest version with `publishedAt` at or before `clock`, or null. ISO-8601 timestamps compare as strings. */
export const publishedAsOf = (model: EventDocSummary, clock: QpqIsoDateTime): Nullable<EventDocVersion> =>
  maxByVersion(model.versions.filter((version) => version.publishedAt !== undefined && version.publishedAt <= clock));
