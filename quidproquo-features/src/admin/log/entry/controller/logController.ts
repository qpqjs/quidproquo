import {
  askConfigGetApplicationInfo,
  askConfigGetGlobal,
  askFileExists,
  askFileGenerateTemporarySecureUrl,
  AskResponse,
  askThrowError,
  ErrorTypeEnum,
  QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME,
  QpqRuntimeType,
} from 'quidproquo-core';
import { askServiceFunctionExecute } from 'quidproquo-webserver';
import { HTTPEvent, HTTPEventResponse } from 'quidproquo-webserver';
import { askFromJsonEventRequest, toJsonEventResponse } from 'quidproquo-webserver';

import { QPQ_TRACE_LOG_SERVICE_FUNCTION_NAME, QpqTraceLogExecutionPayload } from '../../config/traceLogServiceFunction';
import { logsLogic } from '../../logic';
import { askToggleLogChecked } from '../../logic/logs';
import { askGetByCorrelation, askGetByFromCorrelation, askGetHierarchiesByCorrelation } from '../data/logMetadataData';
import { askEnsureRedactedLog, askGetRedactedByCorrelation } from '../data/redactedLogData';

export interface GetLogsParams {
  nextPageKey?: string;

  startIsoDateTime: string;
  endIsoDateTime: string;
  runtimeType: QpqRuntimeType;

  infoFilter: string;
  errorFilter: string;
  serviceFilter: string;
  userFilter: string;
  deep: string;
  onlyErrors: boolean;
}

export function* getLogs(event: HTTPEvent, params: {}): AskResponse<HTTPEventResponse> {
  const { nextPageKey, startIsoDateTime, endIsoDateTime, runtimeType, errorFilter, serviceFilter, infoFilter, userFilter, onlyErrors, deep } =
    yield* askFromJsonEventRequest<GetLogsParams>(event);

  const logs = yield* logsLogic.askGetLogs(
    runtimeType,
    startIsoDateTime,
    endIsoDateTime,
    errorFilter,
    serviceFilter,
    infoFilter,
    userFilter,
    deep,
    onlyErrors,
    nextPageKey,
  );

  return toJsonEventResponse(logs);
}

export function* getLog(
  event: HTTPEvent,
  params: {
    correlationId: string;
  },
) {
  const log = yield* askGetByCorrelation(params.correlationId);
  if (!log) {
    yield* askThrowError(ErrorTypeEnum.NotFound, 'Log not found');
  }

  return toJsonEventResponse(log);
}

export function* toggleLogCheck(
  event: HTTPEvent,
  params: {
    correlationId: string;
  },
) {
  const log = yield* askToggleLogChecked(params.correlationId, false);

  return toJsonEventResponse(log);
}

export function* getServiceNames(event: HTTPEvent) {
  const services = yield* askConfigGetGlobal<string[]>('qpq-serviceNames');
  const logServiceName = yield* askConfigGetGlobal<string>('qpq-log-service-name');

  return toJsonEventResponse({ services, logServiceName });
}

export function* getHierarchies(
  event: HTTPEvent,
  params: {
    correlationId: string;
  },
) {
  const reportUrl = yield* askGetHierarchiesByCorrelation(params.correlationId, event.query.refresh === 'true');

  return toJsonEventResponse({ url: reportUrl });
}

export function* getChildren(
  event: HTTPEvent,
  params: {
    fromCorrelation: string;
  },
) {
  const log = yield* askGetByFromCorrelation(params.fromCorrelation);

  return toJsonEventResponse(log);
}

export function* downloadUrl(
  event: HTTPEvent,
  params: {
    correlationId: string;
  },
) {
  const redactedPath = yield* askEnsureRedactedLog(params.correlationId);

  if (!redactedPath) {
    return toJsonEventResponse({ url: '', isColdStorage: true });
  }

  const url = yield* askFileGenerateTemporarySecureUrl(QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME, redactedPath, 1 * 60 * 1000);

  return toJsonEventResponse({ url, isColdStorage: false });
}

// Replays the log against its service's real code under the execution tracer and
// returns a signed url to the resulting QpqExecutionTrace json. The trace itself is
// produced by the OWNING service (routed on the log's moduleName) so the story code
// loads through that service's own module loader — see trace-replay-plan.md.
// The replay input is the redacted log, so the stored trace (which records local
// variables) never carries anything the admin could not already read.
//
// ASYNC: tracing re-executes the story and can far outlive an HTTP request, so this
// never waits for it. Responses are { url } when a stored trace exists, otherwise
// { pending: true } with the trace kicked off fire-and-forget — the owning service
// replies via qpqStoreTraceResult, which stores the trace and pushes a TraceDone
// websocket message to admin clients. `check=true` only reports state (never triggers),
// so clients can poll without stacking trace runs; `refresh=true` forces a re-run.
export function* traceLog(
  event: HTTPEvent,
  params: {
    correlationId: string;
  },
) {
  const traceFilePath = `${params.correlationId}.trace.json`;

  const refresh = event.query.refresh === 'true';
  const checkOnly = event.query.check === 'true';
  const onlyOwnCode = event.query.onlyOwnCode === 'true';

  if (!refresh) {
    const traceExists = yield* askFileExists(QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME, traceFilePath);
    if (traceExists) {
      const url = yield* askFileGenerateTemporarySecureUrl(QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME, traceFilePath, 5 * 60 * 1000);
      return toJsonEventResponse({ url });
    }
  }

  if (checkOnly) {
    return toJsonEventResponse({ pending: true });
  }

  const storyResult = yield* askGetRedactedByCorrelation(params.correlationId);
  const applicationInfo = yield* askConfigGetApplicationInfo();

  const traceLogPayload: QpqTraceLogExecutionPayload = {
    storyResult,
    replyToService: applicationInfo.module,
    onlyOwnCode,
  };

  yield* askServiceFunctionExecute<void, QpqTraceLogExecutionPayload>(
    storyResult.moduleName,
    QPQ_TRACE_LOG_SERVICE_FUNCTION_NAME,
    traceLogPayload,
    true, // fire and forget
  );

  return toJsonEventResponse({ pending: true });
}
