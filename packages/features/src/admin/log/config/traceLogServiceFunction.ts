import { QpqExecutionTrace, StoryResult } from 'quidproquo-core';

// The async trace-replay handshake (see trace-replay-plan.md):
//
//   1. logController.traceLog fires QPQ_TRACE_LOG_SERVICE_FUNCTION_NAME on the service
//      that OWNS the log (fire-and-forget — tracing re-executes the story and can far
//      outlive an HTTP request) and returns { pending: true }.
//   2. The owning service replays the log under the execution tracer, then calls
//      QPQ_STORE_TRACE_RESULT_SERVICE_FUNCTION_NAME back on the log service with the
//      trace (or the failure).
//   3. The log service stores the trace on the reports drive and pushes a TraceDone
//      websocket message to admin clients, which re-request the trace route for the
//      stored trace's signed url.
//
// Names kept short: deployed lambdas are `<functionName>-sfunc-<service>-<env>-<feature>`
// and AWS caps function names at 64 chars — long service/feature names leave ~15 chars.

// Exposed by EVERY service (via defineAdminSettings), so traces run in the service
// whose module loader owns the log's code (federated store on lambda).
export const QPQ_TRACE_LOG_SERVICE_FUNCTION_NAME = 'qpqTraceLog';

// Exposed by the LOG service only — the reply channel for finished traces.
export const QPQ_STORE_TRACE_RESULT_SERVICE_FUNCTION_NAME = 'qpqTraceStore';

export interface QpqTraceLogExecutionPayload {
  storyResult: StoryResult<any>;

  // The log service's module name — where the result gets sent back to
  replyToService: string;

  // Only trace statements in the service's own code (no node_modules breakpoints)
  onlyOwnCode?: boolean;
}

export interface QpqStoreTraceResultPayload {
  correlation: string;

  // Exactly one of these: the finished trace, or why there isn't one
  trace?: QpqExecutionTrace;
  errorText?: string;
}
