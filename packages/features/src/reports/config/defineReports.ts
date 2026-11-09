import { defineDynamicFunctions, defineEventBus, defineGlobal, defineQueue, defineServiceSettings, QPQConfig } from '@qpqjs/core';

import { defineEventDocSummary } from '../../eventDoc/config/defineEventDocSummary';
import { eventDocFunctionsName } from '../../eventDoc/constants/eventDocFunctionsName';
import { getFeatureEntryQpqFunctionRuntime } from '../../getFeatureEntryQpqFunctionRuntime';
import { reportConfigGlobal } from '../constants/reportConfigGlobal';
import { reportEventBusName } from '../constants/reportEventBusName';
import { REPORT_EVENTS_MESSAGE_TYPE } from '../constants/reportEventsMessageType';
import { REPORT_MONTH_DOC_TYPE } from '../constants/reportMonthDocType';
import { REPORT_NAME_GLOBAL } from '../constants/reportNameGlobal';
import { REPORT_QUEUE_BATCH_SIZE } from '../constants/reportQueueBatchSize';
import { REPORT_QUEUE_MAX_TRIES } from '../constants/reportQueueMaxTries';
import { reportQueueName } from '../constants/reportQueueName';
import { REPORT_QUEUE_RETRY_SECONDS } from '../constants/reportQueueRetrySeconds';
import { reportStoreName } from '../constants/reportStoreName';
import { resolveReportsConfig } from '../logic/resolveReportsConfig';
import { ReportsOptions } from '../types/ReportsOptions';

/**
 * A report: a named place any service appends events to and reads views from. Declared identically in every service;
 * the owner's deploy creates the bus, the month document stores, the drive and the queue that folds events into them,
 * and every other service references them.
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

    // Owner only: one FIFO group per scope and event type gives each month document exactly one writer.
    defineServiceSettings({
      [options.owner.module]: [
        defineQueue(
          reportQueueName(reportName),
          {
            [REPORT_EVENTS_MESSAGE_TYPE]: {
              ...getFeatureEntryQpqFunctionRuntime('reports', 'queueEvent', 'onReportEvents::onReportEvents'),
              globals: { [REPORT_NAME_GLOBAL]: reportName },
            },
          },
          {
            isFifo: true,
            batchSize: REPORT_QUEUE_BATCH_SIZE,
            maxTries: REPORT_QUEUE_MAX_TRIES,
            ttRetryInSeconds: REPORT_QUEUE_RETRY_SECONDS,
            eventBusSubscriptions: [reportEventBusName(reportName)],
          },
        ),
      ],
    }),
  ];
};
