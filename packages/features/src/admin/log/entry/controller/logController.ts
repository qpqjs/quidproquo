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
} from '@qpqjs/core';
import { askServiceFunctionExecute } from '@qpqjs/webserver';
import { HTTPEvent, HTTPEventResponse } from '@qpqjs/webserver';
import { askFromJsonEventRequest, toJsonEventResponse } from '@qpqjs/webserver';

import { ADMIN_LOG_SERVICE_NAME_GLOBAL, ADMIN_SERVICE_NAMES_GLOBAL } from '../../../constants';
import { QPQ_TRACE_LOG_SERVICE_FUNCTION_NAME, QpqTraceLogExecutionPayload } from '../../config/traceLogServiceFunction';
import {
  askLogMetadataGetByCorrelation,
  askLogMetadataGetByFromCorrelation,
  askLogMetadataGetHierarchiesByCorrelation,
} from '../../data/logMetadata';
import { askEnsureRedactedLog, askRedactedLogGetByCorrelation } from '../../data/redactedLogData';
import { logsLogic } from '../../logic';
import { askToggleLogChecked } from '../../logic/logs';
import { LogDeepSearchQuery } from '../domain';

export function* getLogs(event: HTTPEvent, params: {}): AskResponse<HTTPEventResponse> {
  const query = yield* askFromJsonEventRequest<LogDeepSearchQuery>(event);

  const logs = yield* logsLogic.askLogGetAll(query);

  return toJsonEventResponse(logs);
}

export function* getLog(
  event: HTTPEvent,
  params: {
    correlationId: string;
  },
) {
  const log = yield* askLogMetadataGetByCorrelation(params.correlationId);
  if (!log) {
    return yield* askThrowError(ErrorTypeEnum.NotFound, 'Log not found');
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
  const services = yield* askConfigGetGlobal<string[]>(ADMIN_SERVICE_NAMES_GLOBAL);
  const logServiceName = yield* askConfigGetGlobal<string>(ADMIN_LOG_SERVICE_NAME_GLOBAL);

  return toJsonEventResponse({ services, logServiceName });
}

export function* getHierarchies(
  event: HTTPEvent,
  params: {
    correlationId: string;
  },
) {
  const reportUrl = yield* askLogMetadataGetHierarchiesByCorrelation(params.correlationId, event.query.refresh === 'true');

  return toJsonEventResponse({ url: reportUrl });
}

export function* getChildren(
  event: HTTPEvent,
  params: {
    fromCorrelation: string;
  },
) {
  const log = yield* askLogMetadataGetByFromCorrelation(params.fromCorrelation);

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
// loads through that service's own module loader, see trace-replay-plan.md.
// The replay input is the redacted log, so the stored trace (which records local
// variables) never carries anything the admin could not already read.
//
// ASYNC: tracing re-executes the story and can far outlive an HTTP request, so this
// never waits for it. Responses are { url } when a stored trace exists, otherwise
// { pending: true } with the trace kicked off fire-and-forget, the owning service
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

  const storyResult = yield* askRedactedLogGetByCorrelation(params.correlationId);
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
