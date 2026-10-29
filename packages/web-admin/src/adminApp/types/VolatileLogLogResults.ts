import { Nullable } from '@qpqjs/core';
import { LogLog } from '@qpqjs/features';

// A log-log search's cached response; progress as for VolatileLogResults.
export type VolatileLogLogResults = {
  logLogs: LogLog[];
  partsTotal: number;
  partsDone: number;
  isSearching: boolean;
  fetchedAt: Nullable<string>;
};
