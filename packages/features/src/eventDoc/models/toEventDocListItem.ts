import { Nullable } from 'quidproquo-core';

import { EventDocListItem } from './EventDocListItem';
import { EventDocSummary } from './EventDocSummary';
import { EventDocVersion } from './EventDocVersion';

const latestVersion = (versions: EventDocVersion[]): Nullable<EventDocVersion> =>
  versions.reduce<Nullable<EventDocVersion>>((max, version) => (!max || version.version > max.version ? version : max), null);

/** Flattens a summary into a display-ready list row. */
export const toEventDocListItem = (model: EventDocSummary): EventDocListItem => {
  const latest = latestVersion(model.versions);

  return {
    id: model.id,
    type: model.type,
    name: model.name,
    version: latest?.version ?? null,
    hasDraft: latest ? latest.publishedAt === undefined : false,
    updatedAt: model.updatedAt,
    updatedBy: model.updatedBy,
    createdAt: model.createdAt,
    createdBy: model.createdBy,
  };
};
