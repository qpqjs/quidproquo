import { askDateNow, AskResponse, LogLevelEnum, NotifyErrorQueueErrorEventPayload } from '@qpqjs/core';

import { LogLog } from '../../entry';
import { askLogLogUpsert } from '../../entry/data/logLogData';

export function* askNotifyErrorProcessError(error: NotifyErrorQueueErrorEventPayload): AskResponse<void> {
  const inError = error.newStateInAlarm;
  const startEnd = inError ? '(Start)' : '(End)';
  const message = `Error ${startEnd} - ${error.newStateReason}`;
  const logLevel: LogLevelEnum = inError ? LogLevelEnum.Fatal : LogLevelEnum.Info;

  const logLog: LogLog = {
    type: logLevel,
    reason: message,
    timestamp: yield* askDateNow(),
  };

  yield* askLogLogUpsert(logLog);
}
