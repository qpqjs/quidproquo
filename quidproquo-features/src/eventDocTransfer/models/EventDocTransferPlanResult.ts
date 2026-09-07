import { EventDocBundleSource } from './EventDocBundleSource';
import { EventDocTransferPlanRow } from './EventDocTransferPlanRow';

/** Response of POST /transfer/plan: the rows plus the bundle's provenance. */
export type EventDocTransferPlanResult = {
  source: EventDocBundleSource;
  rows: EventDocTransferPlanRow[];
};
