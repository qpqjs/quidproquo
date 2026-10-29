import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionConfigSyncRequestedData } from '../../effects/session/AdminSessionConfigSyncRequestedEffect';
import { AdminSessionState } from '../../types/AdminSessionState';

// Recorded purely for audit, the sync itself is a websocket send; nothing in
// the folded state changes.
export const configSyncRequested = (
  state: AdminSessionState,
  _payload: EventDocEventPayload<AdminSessionConfigSyncRequestedData>,
): AdminSessionState => state;
