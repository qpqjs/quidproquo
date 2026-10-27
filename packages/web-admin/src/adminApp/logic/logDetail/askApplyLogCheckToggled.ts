import { AskResponse } from 'quidproquo-core';

import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminSessionEventType } from '../../effects/session/AdminSessionEventType';
import { LogCheckToggledData } from '../../effects/session/LogCheckToggledEvent';

// Audit record only — the actual mutation still travels over the admin
// websocket (MarkLogChecked) exactly as before.
export function* askApplyLogCheckToggled(correlationId: string, checked: boolean): AskResponse<void> {
  yield* askApplySessionEvent<LogCheckToggledData>(AdminSessionEventType.logCheckToggled, { correlationId, checked });
}
