import { AskResponse } from '@qpqjs/core';

import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminSessionEffect } from '../../effects/session/AdminSessionEffect';
import { AdminSessionTabChangedData } from '../../effects/session/AdminSessionTabChangedEffect';
import { askProjectSessionToUrl } from '../url/askProjectSessionToUrl';

export function* askApplyTabChanged(tab: number, tabName: string): AskResponse<void> {
  yield* askApplySessionEvent<AdminSessionTabChangedData>(AdminSessionEffect.TabChanged, { tab, tabName });

  yield* askProjectSessionToUrl();
}
