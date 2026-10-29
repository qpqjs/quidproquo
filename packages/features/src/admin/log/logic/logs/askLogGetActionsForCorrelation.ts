import { AskResponse, isErroredActionResult, resolveActionResultError } from '@qpqjs/core';

import { askRedactedLogGetByCorrelation } from '../../entry/data/redactedLogData';

export type LogAiToolActionSummary = {
  index: number;
  actionType: string;
  startedAt: string;
  finishedAt: string;
  executionTimeMs: number;
  success: boolean;
  error?: string;
};

// The compact index an AI chat scans first, one row per action in the log's history,
// cheap enough to hand the model in full. Detail (input/output) is a separate lookup
// via askLogGetActionDetail, so a large log doesn't get pasted whole into every turn.
export function* askLogGetActionsForCorrelation(correlationId: string): AskResponse<LogAiToolActionSummary[]> {
  const log = yield* askRedactedLogGetByCorrelation(correlationId);

  return log.history.map((entry, index) => {
    const success = !isErroredActionResult(entry.res);

    return {
      index,
      actionType: entry.act.type,
      startedAt: entry.startedAt,
      finishedAt: entry.finishedAt,
      executionTimeMs: new Date(entry.finishedAt).getTime() - new Date(entry.startedAt).getTime(),
      success,
      error: success ? undefined : resolveActionResultError(entry.res).errorText,
    };
  });
}
