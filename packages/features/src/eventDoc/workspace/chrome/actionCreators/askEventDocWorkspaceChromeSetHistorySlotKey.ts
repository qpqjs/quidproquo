import { AskResponse, Nullable } from '@qpqjs/core';

import { askApplyEventDocEvent } from '../../../actions/askApplyEventDocEvent';
import { EventDocWorkspaceChromeEffect } from '../effects/EventDocWorkspaceChromeEffect';
import { EventDocWorkspaceChromeSetHistorySlotKeyEffect } from '../effects/EventDocWorkspaceChromeSetHistorySlotKeyEffect';

/** Sets which slot the history panel shows. */
export function* askEventDocWorkspaceChromeSetHistorySlotKey(slotKey: Nullable<string>): AskResponse<void> {
  yield* askApplyEventDocEvent<EventDocWorkspaceChromeSetHistorySlotKeyEffect>(EventDocWorkspaceChromeEffect.SetHistorySlotKey, { slotKey });
}
