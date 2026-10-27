import { AskResponse } from 'quidproquo-core';

import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminSessionEventType } from '../../effects/session/AdminSessionEventType';
import { ConfigSyncRequestedData } from '../../effects/session/ConfigSyncRequestedEvent';

// Audit record only — the actual sync request still travels over the admin
// websocket (ConfigSyncRequest) from the component glue.
export function* askApplyConfigSyncRequested(): AskResponse<void> {
  yield* askApplySessionEvent<ConfigSyncRequestedData>(AdminSessionEventType.configSyncRequested, {});
}
