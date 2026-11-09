import { defineModule, qpqCoreUtils } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { eventDocEventsStoreName } from '../../eventDoc/constants/eventDocEventsStoreName';
import { eventDocFunctionsName } from '../../eventDoc/constants/eventDocFunctionsName';
import { EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL } from '../../eventDoc/constants/eventDocGlobalNames';
import { EVENT_DOC_RECENT_CLIENT_MESSAGE_ID_WINDOW } from '../../eventDoc/constants/eventDocRecentClientMessageIdWindow';
import { reportConfigGlobal } from '../constants/reportConfigGlobal';
import { reportEventBusName } from '../constants/reportEventBusName';
import { REPORT_EVENTS_MESSAGE_TYPE } from '../constants/reportEventsMessageType';
import { REPORT_MONTH_DOC_TYPE } from '../constants/reportMonthDocType';
import { REPORT_NAME_GLOBAL } from '../constants/reportNameGlobal';
import { REPORT_QUEUE_BATCH_SIZE } from '../constants/reportQueueBatchSize';
import { reportQueueName } from '../constants/reportQueueName';
import { reportStoreName } from '../constants/reportStoreName';
import { ReportBucket } from '../models/ReportBucket';
import { ReportCompare } from '../models/ReportCompare';
import { ReportPeriod } from '../models/ReportPeriod';
import { ReportsConfig } from '../models/ReportsConfig';
import { reportMonthEventDoc } from '../module/reportMonthEventDoc';
import { ReportsOptions } from '../types/ReportsOptions';
import { defineReports } from './defineReports';

const owner = { module: 'template' };
const views = {
  rendersByKind: { event: 'documentRendered', period: { period: ReportPeriod.Last7Days }, bucket: ReportBucket.Day, groupBy: 'templateKind' },
} as const;
// A service declares its module before anything else; the owner-only block opens against it.
const reports = defineReports('docgen', {
  owner,
  utcOffset: '+10:00',
  views,
  events: { documentRendered: { retentionMonths: 13 } },
  scoped: true,
});
const config = [defineModule('template'), reports];

const definingWith =
  (options: Partial<ReportsOptions>, reportName = 'docgen') =>
  () =>
    defineReports(reportName, { owner, ...options });

describe('defineReports', () => {
  it('publishes the declaration as a global, defaults resolved', () => {
    expect(qpqCoreUtils.getGlobalConfigValue<ReportsConfig>(config, reportConfigGlobal('docgen'))).toEqual({
      utcOffset: '+10:00',
      financialYearStartMonth: 7,
      scoped: true,
      views,
      events: { documentRendered: { retentionMonths: 13 } },
    });
  });

  it("declares a FIFO bus owned by the owner's module", () => {
    const buses = qpqCoreUtils.getAllEventBusConfigs(config);

    expect(buses.map((bus) => [bus.name, bus.isFifo, bus.owner?.module])).toEqual([[reportEventBusName('docgen'), true, 'template']]);
  });

  it("declares the month documents' stores and drive, owned by the owner, scoped, with the month fold as the snapshot function", () => {
    const storeName = reportStoreName('docgen');
    const stores = qpqCoreUtils.getAllKeyValueStoreConfigs(config);
    const eventsStore = stores.find((kvs) => kvs.keyValueStoreName === eventDocEventsStoreName(storeName));
    const runtime = eventsStore?.onStream?.runtime;

    expect(stores).toHaveLength(3);
    expect(stores.every((kvs) => kvs.owner?.module === 'template' && kvs.scoped === true)).toBe(true);
    expect(qpqCoreUtils.getAllStorageDriveConfigs(config).map((drive) => [drive.owner?.module, drive.scoped])).toEqual([['template', true]]);
    expect(runtime && typeof runtime === 'object' ? runtime.globals?.[EVENT_DOC_SNAPSHOT_FUNCTIONS_GLOBAL] : undefined).toEqual({
      [REPORT_MONTH_DOC_TYPE]: eventDocFunctionsName(storeName, REPORT_MONTH_DOC_TYPE),
    });
  });

  it('registers the month fold in every service, owned by none, pointing at the module that exports it', () => {
    const [functions] = qpqCoreUtils.getAllDynamicFunctions(config);

    expect(functions?.dynamicFunctionsName).toBe(eventDocFunctionsName(reportStoreName('docgen'), REPORT_MONTH_DOC_TYPE));
    expect(functions?.owner).toBeUndefined();
    expect(functions?.runtime).toMatchObject({ relativePath: '../module/reportMonthEventDoc', functionName: 'reportMonthEventDoc' });
    expect(typeof reportMonthEventDoc.foldDocumentState).toBe('function');
  });

  it("declares the folding queue only on the owner's deploy: FIFO, subscribed to the FIFO bus, handing the shared entry its report", () => {
    const owner = config;
    const other = [defineModule('pdf'), reports];
    const [queue] = qpqCoreUtils.getAllQueueConfigs(owner);
    const runtime = queue?.qpqQueueProcessors[REPORT_EVENTS_MESSAGE_TYPE];

    expect(qpqCoreUtils.getAllQueueConfigs(other)).toEqual([]);
    expect(queue).toMatchObject({ name: reportQueueName('docgen'), isFifo: true, eventBusSubscriptions: [reportEventBusName('docgen')] });
    expect(queue!.maxTries).toBeGreaterThan(1);
    expect(runtime && typeof runtime === 'object' ? [runtime.relativePath, runtime.functionName, runtime.globals] : undefined).toEqual([
      'reports/entry/queueEvent/onReportEvents',
      'onReportEvents',
      { [REPORT_NAME_GLOBAL]: 'docgen' },
    ]);
    expect(() => qpqCoreUtils.assertFifoQueueEventBusSubscriptionsAreValid(owner)).not.toThrow();
  });

  // Every message of a batch SQS redelivers must still be in the month document's dedup window.
  it('keeps the queue batch within the dedup window', () => {
    expect(qpqCoreUtils.getAllQueueConfigs(config)[0]!.batchSize).toBe(REPORT_QUEUE_BATCH_SIZE);
    expect(REPORT_QUEUE_BATCH_SIZE).toBeLessThanOrEqual(EVENT_DOC_RECENT_CLIENT_MESSAGE_ID_WINDOW);
  });

  it('defaults to +00:00, a July financial year and unscoped', () => {
    expect(
      qpqCoreUtils.getGlobalConfigValue<ReportsConfig>([defineModule('template'), defineReports('kiln', { owner })], reportConfigGlobal('kiln')),
    ).toEqual({
      utcOffset: '+00:00',
      financialYearStartMonth: 7,
      scoped: false,
      views: {},
      events: {},
    });
  });

  it('refuses a declaration it could not count or read', () => {
    expect(definingWith({}, 'doc-gen')).toThrow('the report name');
    expect(definingWith({ utcOffset: '+10' as never })).toThrow("'+10' is not a UTC offset");
    expect(definingWith({ utcOffset: '+15:00' })).toThrow("'+15:00' is not a UTC offset");
    expect(definingWith({ financialYearStartMonth: 13 })).toThrow('financialYearStartMonth');
    expect(definingWith({ views: { bad: { event: 'x', period: { period: ReportPeriod.ThisMonth }, bucket: ReportBucket.Hour } } })).toThrow(
      "view 'bad': an hourly bucket",
    );
    expect(definingWith({ views: { bad: { event: 'x', period: { period: ReportPeriod.Today }, compare: ReportCompare.SameDayLastWeek } } })).toThrow(
      'today can only',
    );
    expect(definingWith({ events: { documentRendered: { maxCellsPerBucket: 0 } } })).toThrow('events.documentRendered: maxCellsPerBucket');
    expect(definingWith({ events: { documentRendered: { maxMeasureNames: 1.5 } } })).toThrow('events.documentRendered: maxMeasureNames');
  });
});
