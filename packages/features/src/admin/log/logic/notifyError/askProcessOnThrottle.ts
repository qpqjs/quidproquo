import { askDateNow, AskResponse, LogLevelEnum, NotifyErrorQueueTimeoutEventPayload } from 'quidproquo-core';

import { LogLog } from '../../entry';
import { askUpsert } from '../../entry/data/logLogData';

export function* askProcessOnThrottle(error: NotifyErrorQueueTimeoutEventPayload): AskResponse<void> {
  const inError = error.newStateInAlarm;
  const startEnd = inError ? '(Start)' : '(End)';
  const message = `Throttle ${startEnd} - ${error.newStateReason}`;
  // const logLevel: LogLevelEnum = inError ? LogLevelEnum.Fatal : LogLevelEnum.Info;

  const logLog: LogLog = {
    type: LogLevelEnum.Warn,
    reason: message,
    timestamp: yield* askDateNow(),
  };

  yield* askUpsert(logLog);
}
