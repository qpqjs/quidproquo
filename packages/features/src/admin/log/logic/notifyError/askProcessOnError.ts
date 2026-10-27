import { askDateNow, AskResponse, LogLevelEnum, NotifyErrorQueueErrorEventPayload } from 'quidproquo-core';

import { LogLog } from '../../entry';
import { askUpsert } from '../../entry/data/logLogData';

export function* askProcessOnError(error: NotifyErrorQueueErrorEventPayload): AskResponse<void> {
  const inError = error.newStateInAlarm;
  const startEnd = inError ? '(Start)' : '(End)';
  const message = `Error ${startEnd} - ${error.newStateReason}`;
  const logLevel: LogLevelEnum = inError ? LogLevelEnum.Fatal : LogLevelEnum.Info;

  const logLog: LogLog = {
    type: logLevel,
    reason: message,
    timestamp: yield* askDateNow(),
  };

  yield* askUpsert(logLog);
}
