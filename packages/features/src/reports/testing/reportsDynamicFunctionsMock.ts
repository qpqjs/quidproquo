import { DynamicFunctionsActionType } from '@qpqjs/core';

import { reportMonthEventDoc } from '../module/reportMonthEventDoc';

type DynamicFunctionsExecuteAction = { payload: { functionName: string; args: unknown[] } };

/** Runs one of the month fold's real dynamic functions, as the runtime would. */
const executeReportMonthFunction = (action: DynamicFunctionsExecuteAction): unknown =>
  (reportMonthEventDoc as unknown as Record<string, (...args: unknown[]) => unknown>)[action.payload.functionName]!(...action.payload.args);

/** Mocks for runStory that run the month fold's real dynamic functions (foldDocumentState, getSnapshotCacheKey and the rest). */
export const reportsDynamicFunctionsMock = {
  [DynamicFunctionsActionType.Execute]: executeReportMonthFunction,
};
