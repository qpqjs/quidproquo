import { AskResponse, LogLevelEnum } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse } from 'quidproquo-webserver';
import { askFromJsonEventRequest, toJsonEventResponse } from 'quidproquo-webserver';

import { logLogLogic } from '../../logic/logLog';

export interface GetLogLogSearchParams {
  logLevel: LogLevelEnum;

  startIsoDateTime: string;
  endIsoDateTime: string;

  reasonFilter: string;
  serviceFilter: string;

  nextPageKey?: string;
}

export function* getLogLogs(event: HTTPEvent, params: {}): AskResponse<HTTPEventResponse> {
  const { nextPageKey, logLevel, startIsoDateTime, endIsoDateTime, serviceFilter, reasonFilter } =
    yield* askFromJsonEventRequest<GetLogLogSearchParams>(event);

  const logs = yield* logLogLogic.askGetLogLogs(logLevel, startIsoDateTime, endIsoDateTime, serviceFilter, reasonFilter, nextPageKey);

  return toJsonEventResponse(logs);
}
