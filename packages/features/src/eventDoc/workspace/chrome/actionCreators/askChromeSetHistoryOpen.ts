import { AskResponse } from 'quidproquo-core';

import { askApplyEventDocEvent } from '../../../actions/eventDocEvent/askApplyEventDocEvent';
import { EventDocWorkspaceChromeEffect } from '../effects/EventDocWorkspaceChromeEffect';
import { EventDocWorkspaceChromeSetHistoryOpenEffect } from '../effects/EventDocWorkspaceChromeSetHistoryOpenEffect';

/** Opens or closes the history panel on whichever slot this verb is bound to. */
export function* askChromeSetHistoryOpen(open: boolean): AskResponse<void> {
  yield* askApplyEventDocEvent<EventDocWorkspaceChromeSetHistoryOpenEffect>(EventDocWorkspaceChromeEffect.SetHistoryOpen, { open });
}
