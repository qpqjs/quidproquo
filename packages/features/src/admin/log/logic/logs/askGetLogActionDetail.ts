import { AskResponse, askThrowError, ErrorTypeEnum, isErroredActionResult, resolveActionResult, resolveActionResultError } from 'quidproquo-core';

import { askGetRedactedByCorrelation } from '../../entry/data/redactedLogData';

export type LogAiToolActionDetail = {
  index: number;
  actionType: string;
  input: unknown;
  output?: unknown;
  error?: { errorType: string; errorText: string };
  startedAt: string;
  finishedAt: string;
};

// The full breakdown for one action from askGetLogActionsForCorrelation's index —
// the action's own input payload plus its raw output (result or error).
export function* askGetLogActionDetail(correlationId: string, index: number): AskResponse<LogAiToolActionDetail> {
  const log = yield* askGetRedactedByCorrelation(correlationId);
  const entry = log.history[index];

  if (!entry) {
    return yield* askThrowError(
      ErrorTypeEnum.NotFound,
      `No action at index ${index} — this log has ${log.history.length} action(s) (valid indexes: 0-${log.history.length - 1}).`,
    );
  }

  const success = !isErroredActionResult(entry.res);
  const error = success ? undefined : resolveActionResultError(entry.res);

  return {
    index,
    actionType: entry.act.type,
    input: entry.act.payload,
    output: success ? resolveActionResult(entry.res) : undefined,
    error: error ? { errorType: error.errorType, errorText: error.errorText } : undefined,
    startedAt: entry.startedAt,
    finishedAt: entry.finishedAt,
  };
}
