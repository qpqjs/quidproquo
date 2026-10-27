import { QPQError } from 'quidproquo-core';

import { EventDocWorkspaceSlotOperation } from './EventDocWorkspaceSlotOperation';

/** A slot error: the typed QPQError plus the operation it came from. */
export type EventDocWorkspaceSlotError = {
  operation: EventDocWorkspaceSlotOperation;
  error: QPQError;
};
