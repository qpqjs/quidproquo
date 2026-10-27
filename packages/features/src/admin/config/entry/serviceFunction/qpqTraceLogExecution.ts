import { askCatch, AskResponse, askTraceStory } from 'quidproquo-core';
import { askServiceFunctionExecute, ExecuteServiceFunctionEvent } from 'quidproquo-webserver';

import {
  QPQ_STORE_TRACE_RESULT_SERVICE_FUNCTION_NAME,
  QpqStoreTraceResultPayload,
  QpqTraceLogExecutionPayload,
} from '../../../log/config/traceLogServiceFunction';

// The per-service trace entry (defineAdminSettings exposes it from EVERY service as the
// qpqTraceLog service function). Runs ASYNC in the service that owns the log, so
// askTraceStory's processor loads the story's real code through this service's own
// module loader — the federated store on lambda. The result (trace or failure — a
// failure must still notify, or the admin client waits forever) is sent back to the
// log service's qpqTraceStore function, which stores it and pushes a TraceDone
// websocket message. See trace-replay-plan.md.
export function* qpqTraceLogExecution(event: ExecuteServiceFunctionEvent<QpqTraceLogExecutionPayload>): AskResponse<void> {
  const { storyResult, replyToService, onlyOwnCode } = event.payload;

  const traceResult = yield* askCatch(askTraceStory(storyResult, undefined, onlyOwnCode));

  const storeTracePayload: QpqStoreTraceResultPayload = traceResult.success
    ? { correlation: storyResult.correlation, trace: traceResult.result }
    : { correlation: storyResult.correlation, errorText: traceResult.error?.errorText || 'Trace failed' };

  yield* askServiceFunctionExecute<void, QpqStoreTraceResultPayload>(replyToService, QPQ_STORE_TRACE_RESULT_SERVICE_FUNCTION_NAME, storeTracePayload);
}
