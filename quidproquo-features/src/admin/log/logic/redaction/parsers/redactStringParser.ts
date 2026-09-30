import { filterLogHistoryByActionTypes, LogActionType } from 'quidproquo-core';

import { LogRedactionParser } from '../types/LogRedactionParser';

/**
 * Reports, for the final sweep, every value the story marked with askRedactString (anywhere in its
 * history, including inside batched actions). The sweep then removes each one from every string in
 * the log, the marking entry's own payload included; the log itself is returned unchanged.
 */
export const redactStringParser: LogRedactionParser = (log) => ({
  redactedLog: log,
  redactions: filterLogHistoryByActionTypes(log.history ?? [], [LogActionType.RedactString]).flatMap((entry) => {
    const value: unknown = entry.act.payload?.value;
    return typeof value === 'string' ? [value] : [];
  }),
});
