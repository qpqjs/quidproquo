import { Nullable, StoryResultMetadata } from '@qpqjs/core';

// A log search's cached response. Searches fan out one part per runtime type / log level, so progress is partsDone / partsTotal.
export type VolatileLogResults = {
  logs: StoryResultMetadata[];
  partsTotal: number;
  partsDone: number;
  isSearching: boolean;
  fetchedAt: Nullable<string>;
};
