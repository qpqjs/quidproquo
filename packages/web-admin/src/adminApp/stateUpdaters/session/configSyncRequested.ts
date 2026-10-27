import { EventDocEventPayload } from 'quidproquo-features';

import { AdminSessionState } from '../../AdminSessionState';
import { ConfigSyncRequestedData } from '../../effects/session/ConfigSyncRequestedEvent';

// Recorded purely for audit — the sync itself is a websocket send; nothing in
// the folded state changes.
export const configSyncRequested = (state: AdminSessionState, _payload: EventDocEventPayload<ConfigSyncRequestedData>): AdminSessionState => state;
