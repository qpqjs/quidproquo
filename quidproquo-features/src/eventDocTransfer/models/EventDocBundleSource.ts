import { QpqIsoDateTime } from 'quidproquo-core';

/** Where a bundle came from. Provenance for the operator only; import never routes on it. */
export type EventDocBundleSource = {
  application: string;
  environment: string;
  exportedAt: QpqIsoDateTime;
};
