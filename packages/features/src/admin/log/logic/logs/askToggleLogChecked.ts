import { AskResponse } from 'quidproquo-core';

import * as logMetadataData from '../../entry/data/logMetadataData';
import { askGetLoggedInUsername } from '../auth';
import { askSendLogToAdmins } from '../webSocket';

export function* askToggleLogChecked(correlationId: string, checked: boolean): AskResponse<void> {
  const username = yield* askGetLoggedInUsername();

  const updatedLog = yield* logMetadataData.askSetChecked(correlationId, checked, username);

  yield* askSendLogToAdmins(updatedLog);
}
