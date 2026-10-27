import { StoryResultMetadata } from 'quidproquo-core';
import { LogLog } from 'quidproquo-features';

// Server-derived / transient data that is NOT part of the audited session fold.
// Search results are a cache keyed by the raw search params that produced them
// (the request intent lives in the session fold; the response payload lives
// here). Searches fan out one part per runtime type / log level, so progress is
// partsDone / partsTotal.
export type VolatileLogResults = {
  logs: StoryResultMetadata[];
  partsTotal: number;
  partsDone: number;
  isSearching: boolean;
  fetchedAt: string | null;
};

export type VolatileLogLogResults = {
  logLogs: LogLog[];
  partsTotal: number;
  partsDone: number;
  isSearching: boolean;
  fetchedAt: string | null;
};

export type VolatileState = {
  logResults: Record<string, VolatileLogResults>;
  logLogResults: Record<string, VolatileLogLogResults>;
  realtimeErrorLogs: StoryResultMetadata[];
  serviceNames: string[];
  // This admin instance's own deployed service name — needed to address the
  // EventDocAi log chat over the wire (qpq/serviceRequest/{logServiceName}/...).
  logServiceName: string;
};

export const createInitialVolatileState = (): VolatileState => ({
  logResults: {},
  logLogResults: {},
  realtimeErrorLogs: [],
  serviceNames: [],
  logServiceName: '',
});
