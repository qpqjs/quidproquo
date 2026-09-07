import { EventDocDocRef } from './EventDocDocRef';

/** One doc discovered by the manifest walk. */
export type EventDocManifestItem = EventDocDocRef & {
  code: string;
  name: string;
  // 0 for a selected root, link distance otherwise.
  depth: number;
  // Reported but never bundled: deletedAt lives on the summary, not the log, so a bundle would resurrect it.
  deleted: boolean;
};
