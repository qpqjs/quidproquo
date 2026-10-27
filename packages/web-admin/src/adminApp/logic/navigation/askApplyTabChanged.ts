import { AskResponse } from 'quidproquo-core';

import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminSessionEventType } from '../../effects/session/AdminSessionEventType';
import { TabChangedData } from '../../effects/session/TabChangedEvent';
import { askProjectSessionToUrl } from '../url/askProjectSessionToUrl';

export function* askApplyTabChanged(tab: number, tabName: string): AskResponse<void> {
  yield* askApplySessionEvent<TabChangedData>(AdminSessionEventType.tabChanged, { tab, tabName });

  yield* askProjectSessionToUrl();
}
