import { QpqIsoDateTime } from '@qpqjs/core';

/** PUBLISH payload. `effectiveFrom` drives as-of version selection. */
export type EventDocPublishData = {
  effectiveFrom: QpqIsoDateTime;
};
