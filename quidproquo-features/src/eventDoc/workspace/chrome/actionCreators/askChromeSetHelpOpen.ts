import { AskResponse } from 'quidproquo-core';

import { askApplyEventDocEvent } from '../../../actions/eventDocEvent/askApplyEventDocEvent';
import { EventDocWorkspaceChromeEffect } from '../effects/EventDocWorkspaceChromeEffect';
import { EventDocWorkspaceChromeSetHelpOpenEffect } from '../effects/EventDocWorkspaceChromeSetHelpOpenEffect';

/** Opens or closes the help panel. */
export function* askChromeSetHelpOpen(open: boolean): AskResponse<void> {
  yield* askApplyEventDocEvent<EventDocWorkspaceChromeSetHelpOpenEffect>(EventDocWorkspaceChromeEffect.SetHelpOpen, { open });
}
