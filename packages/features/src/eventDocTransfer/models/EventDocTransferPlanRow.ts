import { EventDocDocRef } from './EventDocDocRef';
import { EventDocTransferStatus } from './EventDocTransferStatus';

/** One row of the import review table; the apply reports the same shape back. */
export type EventDocTransferPlanRow = EventDocDocRef & {
  code: string;
  name: string;
  status: EventDocTransferStatus;
  incomingEvents: number;
  existingEvents: number;
  // Set by the apply pass only; 0 on a plan.
  eventsWritten: number;
  assetsWritten: number;
  // Non-zero only when the status is Overwritten.
  discardedEvents: number;
  // Why a blocking status blocks.
  detail?: string;
};
