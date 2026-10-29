import { AskResponse } from '@qpqjs/core';

import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminSessionConfigServiceSelectedData } from '../../effects/session/AdminSessionConfigServiceSelectedEffect';
import { AdminSessionEffect } from '../../effects/session/AdminSessionEffect';

export function* askApplyConfigServiceSelected(service: string): AskResponse<void> {
  yield* askApplySessionEvent<AdminSessionConfigServiceSelectedData>(AdminSessionEffect.ConfigServiceSelected, { service });
}
