import { defineDynamicFunctions, defineEventBus, defineGlobal, QPQConfig } from '@qpqjs/core';

import { defineEventDocSummary } from '../../eventDoc/config/defineEventDocSummary';
import { eventDocFunctionsName } from '../../eventDoc/constants/eventDocFunctionsName';
import { reportConfigGlobal } from '../constants/reportConfigGlobal';
import { reportEventBusName } from '../constants/reportEventBusName';
import { REPORT_MONTH_DOC_TYPE } from '../constants/reportMonthDocType';
import { reportStoreName } from '../constants/reportStoreName';
import { resolveReportsConfig } from '../logic/resolveReportsConfig';
import { ReportsOptions } from '../types/ReportsOptions';

/**
 * A report: a named place any service appends events to and reads views from. Declared identically in every service;
 * the owner's deploy creates the bus, the month document stores and the drive, and every other service references them.
 */
export const defineReports = (reportName: string, options: ReportsOptions): QPQConfig => {
  const config = resolveReportsConfig(reportName, options);
  const storeName = reportStoreName(reportName);
  const functionsName = eventDocFunctionsName(storeName, REPORT_MONTH_DOC_TYPE);

  return [
    defineGlobal(reportConfigGlobal(reportName), config),
    defineEventBus(reportEventBusName(reportName), { isFifo: true, owner: options.owner }),
    defineEventDocSummary(storeName, {
      snapshotFunctions: { [REPORT_MONTH_DOC_TYPE]: functionsName },
      scoped: config.scoped,
      owner: options.owner,
    }),

    // Every service, never only the owner: a dynamic function runs in the service that calls it, and every service that
    // reads a view folds the month documents itself.
    defineDynamicFunctions(functionsName, {
      basePath: __dirname,
      relativePath: '../module/reportMonthEventDoc',
      functionName: 'reportMonthEventDoc',
    }),
  ];
};
