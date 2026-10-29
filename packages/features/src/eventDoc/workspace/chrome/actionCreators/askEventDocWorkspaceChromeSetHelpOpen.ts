import { AskResponse } from '@qpqjs/core';

import { askApplyEventDocEvent } from '../../../actions/askApplyEventDocEvent';
import { EventDocWorkspaceChromeEffect } from '../effects/EventDocWorkspaceChromeEffect';
import { EventDocWorkspaceChromeSetHelpOpenEffect } from '../effects/EventDocWorkspaceChromeSetHelpOpenEffect';

/** Opens or closes the help panel. */
export function* askEventDocWorkspaceChromeSetHelpOpen(open: boolean): AskResponse<void> {
  yield* askApplyEventDocEvent<EventDocWorkspaceChromeSetHelpOpenEffect>(EventDocWorkspaceChromeEffect.SetHelpOpen, { open });
}
