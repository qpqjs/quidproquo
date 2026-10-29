import { AskResponse } from '@qpqjs/core';

import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminSessionEffect } from '../../effects/session/AdminSessionEffect';
import { AdminSessionLogCheckToggledData } from '../../effects/session/AdminSessionLogCheckToggledEffect';

// Audit record only, the actual mutation still travels over the admin
// websocket (MarkLogChecked) exactly as before.
export function* askApplyLogCheckToggled(correlationId: string, checked: boolean): AskResponse<void> {
  yield* askApplySessionEvent<AdminSessionLogCheckToggledData>(AdminSessionEffect.LogCheckToggled, { correlationId, checked });
}
