import { AskResponse, LogLevelEnum } from '@qpqjs/core';
import { HTTPEvent, HTTPEventResponse } from '@qpqjs/webserver';
import { askFromJsonEventRequest, toJsonEventResponse } from '@qpqjs/webserver';

import { logLogLogic } from '../../logic/logLog';

export type GetLogLogSearchParams = {
  logLevel: LogLevelEnum;

  startIsoDateTime: string;
  endIsoDateTime: string;

  reasonFilter: string;
  serviceFilter: string;

  nextPageKey?: string;
};

export function* getLogLogs(event: HTTPEvent, params: {}): AskResponse<HTTPEventResponse> {
  const { nextPageKey, logLevel, startIsoDateTime, endIsoDateTime, serviceFilter, reasonFilter } =
    yield* askFromJsonEventRequest<GetLogLogSearchParams>(event);

  const logs = yield* logLogLogic.askGetLogLogs(logLevel, startIsoDateTime, endIsoDateTime, serviceFilter, reasonFilter, nextPageKey);

  return toJsonEventResponse(logs);
}
