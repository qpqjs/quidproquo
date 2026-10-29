import { StoryResultMetadata } from '@qpqjs/core';

import { VolatileLogLogResults } from './VolatileLogLogResults';
import { VolatileLogResults } from './VolatileLogResults';

// Server-derived / transient data that is NOT part of the audited session fold.
// Search results are a cache keyed by the raw search params that produced them
// (the request intent lives in the session fold; the response payload lives here).
export type VolatileState = {
  logResults: Record<string, VolatileLogResults>;
  logLogResults: Record<string, VolatileLogLogResults>;
  realtimeErrorLogs: StoryResultMetadata[];
  serviceNames: string[];
  // This admin instance's own deployed service name, needed to address the
  // EventDocAi log chat over the wire (qpq/serviceRequest/{logServiceName}/...).
  logServiceName: string;
};
