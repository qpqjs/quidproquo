import { Nullable } from 'quidproquo-core';

import { EventDocSummary, EventDocVersion } from '../../models';
import { latestVersion } from './latestVersion';

/** The unpublished tail version, or null. A draft is always the highest version, so checking the latest is enough. */
export const draftVersion = (model: EventDocSummary): Nullable<EventDocVersion> => {
  const latest = latestVersion(model);
  return latest && latest.publishedAt === undefined ? latest : null;
};
