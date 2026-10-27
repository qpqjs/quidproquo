import { Nullable } from 'quidproquo-core';

import { EventDocSummary, EventDocVersion } from '../../models';
import { maxByVersion } from './maxByVersion';

/** The highest version (published or draft), or null if none exist yet. */
export const latestVersion = (model: EventDocSummary): Nullable<EventDocVersion> => maxByVersion(model.versions);
