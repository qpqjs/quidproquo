import { AskResponse, Nullable } from 'quidproquo-core';

import { askApplyEventDocEvent } from '../../../actions/eventDocEvent/askApplyEventDocEvent';
import { EventDocWorkspaceChromeEffect } from '../effects/EventDocWorkspaceChromeEffect';
import { EventDocWorkspaceChromeSetHistorySlotKeyEffect } from '../effects/EventDocWorkspaceChromeSetHistorySlotKeyEffect';

/** Sets which slot the history panel shows. */
export function* askChromeSetHistorySlotKey(slotKey: Nullable<string>): AskResponse<void> {
  yield* askApplyEventDocEvent<EventDocWorkspaceChromeSetHistorySlotKeyEffect>(EventDocWorkspaceChromeEffect.SetHistorySlotKey, { slotKey });
}
