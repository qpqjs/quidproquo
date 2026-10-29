import { AskResponse } from '@qpqjs/core';

import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminSessionConfigSyncRequestedData } from '../../effects/session/AdminSessionConfigSyncRequestedEffect';
import { AdminSessionEffect } from '../../effects/session/AdminSessionEffect';

// Audit record only, the actual sync request still travels over the admin
// websocket (ConfigSyncRequest) from the component glue.
export function* askApplyConfigSyncRequested(): AskResponse<void> {
  yield* askApplySessionEvent<AdminSessionConfigSyncRequestedData>(AdminSessionEffect.ConfigSyncRequested, {});
}
