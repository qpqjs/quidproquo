import { askDateNow, AskResponse, LogLevelEnum, NotifyErrorQueueTimeoutEventPayload } from '@qpqjs/core';

import { askLogLogUpsert } from '../../data/logLogData';
import { LogLog } from '../../entry';

export function* askNotifyErrorProcessTimeout(error: NotifyErrorQueueTimeoutEventPayload): AskResponse<void> {
  const inError = error.newStateInAlarm;
  const startEnd = inError ? '(Start)' : '(End)';
  const message = `Timeout ${startEnd} - ${error.newStateReason}`;
  const logLevel: LogLevelEnum = inError ? LogLevelEnum.Fatal : LogLevelEnum.Info;

  const logLog: LogLog = {
    type: logLevel,
    reason: message,
    timestamp: yield* askDateNow(),
  };

  yield* askLogLogUpsert(logLog);
}
