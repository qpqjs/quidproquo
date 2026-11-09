import { askMapParallel, AskResponse, Nullable } from '@qpqjs/core';

import { askEventDocDocumentStateLatest } from '../../eventDoc/logic/askEventDocDocumentStateLatest';
import { EventDocDocumentStateAtEvent } from '../../eventDoc/models';
import { ReportMonthDocument } from '../models/ReportMonthDocument';
import { reportMonthDocId } from './reportMonthDocId';

// The month fold wrote these states, so the cast restates what they are. A month with no document reads as nothing.
const toEntry = (month: string, latest: Nullable<EventDocDocumentStateAtEvent> | undefined): [string, ReportMonthDocument][] =>
  latest ? [[month, latest.state as ReportMonthDocument]] : [];

/**
 * The folded state of each month document an event type has for these local months, read in parallel (snapshot seeded,
 * so each fold is only the gap since its last snapshot). A month with no document is left out. Assumes the store context.
 */
export function* askReportMonthStatesRead(type: string, months: string[]): AskResponse<ReadonlyMap<string, ReportMonthDocument>> {
  const latest = yield* askMapParallel(months, function* askReportMonthStateRead(month) {
    return yield* askEventDocDocumentStateLatest(reportMonthDocId(type, month));
  });

  return new Map(months.flatMap((month, index) => toEntry(month, latest[index])));
}
