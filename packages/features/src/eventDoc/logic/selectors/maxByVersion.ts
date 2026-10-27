import { Nullable } from 'quidproquo-core';

import { EventDocVersion } from '../../models';

/** The entry with the highest `version`, or null for an empty list. */
export const maxByVersion = (versions: EventDocVersion[]): Nullable<EventDocVersion> =>
  versions.reduce<Nullable<EventDocVersion>>((max, version) => (!max || version.version > max.version ? version : max), null);
