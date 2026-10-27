import { Nullable } from 'quidproquo-core';

import { EventDocSummary, EventDocVersion } from '../../models';
import { maxByVersion } from './maxByVersion';

/** The highest published version (has `publishedAt`), or null if none. */
export const latestPublished = (model: EventDocSummary): Nullable<EventDocVersion> =>
  maxByVersion(model.versions.filter((version) => version.publishedAt !== undefined));
