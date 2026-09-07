import { EventDocTransferStatus } from '../../models';

/** Operator-facing label for each import status, shared so every app says the same thing. */
export const EVENT_DOC_TRANSFER_STATUS_LABELS: Record<EventDocTransferStatus, string> = {
  [EventDocTransferStatus.New]: 'New',
  [EventDocTransferStatus.FastForward]: 'Update',
  [EventDocTransferStatus.Same]: 'Already up to date',
  [EventDocTransferStatus.Diverged]: 'Blocked: changed here',
  [EventDocTransferStatus.CodeConflict]: 'Blocked: code in use',
  [EventDocTransferStatus.Overwritten]: 'Overwritten',
  [EventDocTransferStatus.Ignored]: 'Skipped',
};
