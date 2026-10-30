import { AskResponse } from '@qpqjs/core';

import * as logMetadataData from '../../data/logMetadata';
import { askAuthGetLoggedInUsername } from '../auth';
import { askLogSendToAdmins } from '../webSocket';

export function* askToggleLogChecked(correlationId: string, checked: boolean): AskResponse<void> {
  const username = yield* askAuthGetLoggedInUsername();

  const updatedLog = yield* logMetadataData.askLogMetadataSetChecked(correlationId, checked, username);

  yield* askLogSendToAdmins(updatedLog);
}
