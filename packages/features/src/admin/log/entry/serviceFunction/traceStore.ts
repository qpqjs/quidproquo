import { askFileWriteTextContents, AskResponse, QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME } from 'quidproquo-core';
import { ExecuteServiceFunctionEvent } from 'quidproquo-webserver';

import { QpqStoreTraceResultPayload } from '../../config/traceLogServiceFunction';
import { askSendTraceDoneToAdmins } from '../../logic/webSocket/askSendTraceDoneToAdmins';

// The reply half of the async trace handshake (see traceLogServiceFunction.ts): the
// owning service calls this on the LOG service when a trace finishes. Stores the trace
// where the trace route serves it from, then tells connected admin clients it's ready.
export function* qpqStoreTraceResult(event: ExecuteServiceFunctionEvent<QpqStoreTraceResultPayload>): AskResponse<void> {
  const { correlation, trace, errorText } = event.payload;

  if (trace) {
    yield* askFileWriteTextContents(QPQ_LOG_REPORTS_STORAGE_DRIVE_NAME, `${correlation}.trace.json`, JSON.stringify(trace));
  }

  yield* askSendTraceDoneToAdmins(correlation, !!trace, errorText);
}
