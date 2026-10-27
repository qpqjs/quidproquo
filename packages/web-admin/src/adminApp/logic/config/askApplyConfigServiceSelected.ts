import { AskResponse } from 'quidproquo-core';

import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminSessionEventType } from '../../effects/session/AdminSessionEventType';
import { ConfigServiceSelectedData } from '../../effects/session/ConfigServiceSelectedEvent';

export function* askApplyConfigServiceSelected(service: string): AskResponse<void> {
  yield* askApplySessionEvent<ConfigServiceSelectedData>(AdminSessionEventType.configServiceSelected, { service });
}
