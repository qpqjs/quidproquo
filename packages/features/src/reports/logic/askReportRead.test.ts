import { askStorageScopeProvide, ConfigActionType, DateActionType, GuidActionType, LogActionType, QueueEvent, QueueMessage } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { reportConfigGlobal } from '../constants/reportConfigGlobal';
import { REPORT_EVENTS_MESSAGE_TYPE } from '../constants/reportEventsMessageType';
import { REPORT_NAME_GLOBAL } from '../constants/reportNameGlobal';
import { onReportEvents } from '../entry/queueEvent/onReportEvents';
import { ReportBucket } from '../models/ReportBucket';
import { ReportPeriod } from '../models/ReportPeriod';
import { ReportPeriodUnit } from '../models/ReportPeriodUnit';
import { ReportQueuedEvent } from '../models/ReportQueuedEvent';
import { ReportsConfig } from '../models/ReportsConfig';
import { createReportsMemoryStore } from '../testing/createReportsMemoryStore';
import { reportsDynamicFunctionsMock } from '../testing/reportsDynamicFunctionsMock';
import { askReportRead } from './askReportRead';

// 15:12 on Monday 9 November 2026 at +10:00.
const NOW = '2026-11-09T05:12:40.118Z';
const CONFIG: ReportsConfig = {
  utcOffset: '+10:00',
  financialYearStartMonth: 7,
  scoped: true,
  views: {
    rendersByKind: { event: 'documentRendered', period: { period: ReportPeriod.Last7Days }, bucket: ReportBucket.Day, groupBy: 'templateKind' },
  },
  events: {},
};

const rendered = (at: string, templateKind: string): ReportQueuedEvent => ({
  type: 'documentRendered',
  at: at as ReportQueuedEvent['at'],
  utcOffset: '+10:00',
  dimensions: { templateKind, outcome: 'ok' },
  measures: { pages: 2 },
});

const mocksFor = (store: ReturnType<typeof createReportsMemoryStore>) => {
  let guids = 0;

  return {
    ...store.mocks,
    ...reportsDynamicFunctionsMock,
    [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) =>
      action.payload.globalName === REPORT_NAME_GLOBAL ? 'docgen' : action.payload.globalName === reportConfigGlobal('docgen') ? CONFIG : undefined,
    [DateActionType.Now]: NOW,
    [GuidActionType.New]: () => `guid-${(guids += 1)}`,
    [GuidActionType.NewSortableMany]: (action: { payload: { count: number } }) =>
      Array.from({ length: action.payload.count }, () => `cmid-${(guids += 1)}`),
    [LogActionType.Create]: () => undefined,
  };
};

const append = (store: ReturnType<typeof createReportsMemoryStore>, id: string, events: ReportQueuedEvent[]) => {
  const event: QueueEvent<QueueMessage<unknown>> = {
    id,
    groupId: 'TENANT#t1/documentRendered',
    message: { type: REPORT_EVENTS_MESSAGE_TYPE, payload: { scope: 'TENANT#t1', type: 'documentRendered', events } },
  };

  runStory(onReportEvents(event), mocksFor(store));
};

const readAs = (store: ReturnType<typeof createReportsMemoryStore>, scope: string, view: Parameters<typeof askReportRead>[1]) =>
  runStory(askStorageScopeProvide(scope, askReportRead('docgen', view)), mocksFor(store));

describe('askReportRead', () => {
  it('reads back what the consumer folded, across two month documents, through the real month fold', () => {
    const store = createReportsMemoryStore('docgen');

    append(store, 'm1', [rendered('2026-10-31T13:30:00.000Z', 'docx'), rendered('2026-11-03T00:00:00.000Z', 'pdf')]);
    append(store, 'm2', [rendered('2026-11-09T01:00:00.000Z', 'docx')]);
    append(store, 'm2', [rendered('2026-11-09T01:00:00.000Z', 'docx')]);

    const result = readAs(store, 'TENANT#t1', {
      event: 'documentRendered',
      period: { period: ReportPeriod.Last, count: 10, unit: ReportPeriodUnit.Day },
      groupBy: 'templateKind',
    });

    // 23:30 on 31 October, 3 November and 9 November, the redelivered m2 counted once.
    expect(result.period).toMatchObject({ from: '2026-10-31', to: '2026-11-09' });
    expect([result.total, result.sums]).toEqual([3, { pages: 6 }]);
    expect(result.groups!.map((group) => [group.value, group.count])).toEqual([
      ['docx', 2],
      ['pdf', 1],
    ]);
  });

  it('reads a declared view by name', () => {
    const store = createReportsMemoryStore('docgen');

    append(store, 'm1', [rendered('2026-11-09T01:00:00.000Z', 'docx')]);

    const result = readAs(store, 'TENANT#t1', 'rendersByKind');

    expect(result.buckets!.map((bucket) => bucket.count)).toEqual([0, 0, 0, 0, 0, 0, 1]);
  });

  // Security regression: a read runs in the reader's scope, so another tenant reads none of these counts.
  it("reads nothing of another tenant's events", () => {
    const store = createReportsMemoryStore('docgen');

    append(store, 'm1', [rendered('2026-11-09T01:00:00.000Z', 'docx')]);

    expect(readAs(store, 'TENANT#t2', 'rendersByKind').total).toBe(0);
  });

  it('throws Invalid, naming why, for a view it cannot read', () => {
    const store = createReportsMemoryStore('docgen');

    expect(() => readAs(store, 'TENANT#t1', 'noSuchView')).toThrowError(
      /Invalid: askReportRead\('docgen'\): the report declares no view named 'noSuchView'/,
    );
    expect(() =>
      readAs(store, 'TENANT#t1', { event: 'documentRendered', period: { period: ReportPeriod.ThisMonth }, bucket: ReportBucket.Hour }),
    ).toThrowError(/an hourly bucket can only read today or yesterday/);
    expect(() =>
      readAs(store, 'TENANT#t1', { event: 'documentRendered', period: { period: ReportPeriod.Last, count: 30, unit: ReportPeriodUnit.Month } }),
    ).toThrowError(/the period spans 30 months/);
  });
});
