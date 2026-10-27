import { QpqExecutionTrace } from 'quidproquo-core';

import { apiRequestPost, externalRequestGet } from '../../logic';

export interface LogTraceRequestOptions {
  // Force a fresh trace run even when one is stored
  refresh?: boolean;

  // Only report state — never kicks off a trace (safe for polling)
  checkOnly?: boolean;

  // Trace only the service's own code — no breakpoints in node_modules, so the whole
  // step budget goes to user statements
  onlyOwnCode?: boolean;
}

export interface LogTraceResult {
  trace?: QpqExecutionTrace;

  // The trace is running in the owning service — a TraceDone websocket message (or a
  // checkOnly poll finding the stored trace) says when to ask again.
  pending: boolean;
}

// Asks the log service for a trace. A stored trace comes back as a signed url (fetched
// here); otherwise the service starts one fire-and-forget and reports pending — see
// logController.traceLog / trace-replay-plan.md.
export const getLogTrace = async (
  apiBaseUrl: string,
  correlation: string,
  options: LogTraceRequestOptions,
  accessToken?: string,
): Promise<LogTraceResult> => {
  const query = `refresh=${!!options.refresh}&check=${!!options.checkOnly}&onlyOwnCode=${!!options.onlyOwnCode}`;
  const traceUrl = await apiRequestPost<{ url?: string; pending?: boolean }>(`/log/${correlation}/trace?${query}`, {}, apiBaseUrl, accessToken);

  if (traceUrl.url) {
    const trace = await externalRequestGet<QpqExecutionTrace>(traceUrl.url);
    return { trace, pending: false };
  }

  return { pending: !!traceUrl.pending };
};
