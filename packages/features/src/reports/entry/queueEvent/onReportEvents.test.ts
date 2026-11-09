import { ConfigActionType, DateActionType, GuidActionType, LogActionType, LogLevelEnum, QueueEvent, QueueMessage } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { EventDocEffect } from '../../../eventDoc/models';
import { REPORT_SYSTEM_USER_ID } from '../../../systemUsers/reportSystemUserId';
import { reportConfigGlobal } from '../../constants/reportConfigGlobal';
import { REPORT_EVENTS_MESSAGE_TYPE } from '../../constants/reportEventsMessageType';
import { REPORT_NAME_GLOBAL } from '../../constants/reportNameGlobal';
import { ReportMonthEffect } from '../../fold/effects/ReportMonthEffect';
import { ReportQueuedEvent } from '../../models/ReportQueuedEvent';
import { ReportsConfig } from '../../models/ReportsConfig';
import { createReportsMemoryStore } from '../../testing/createReportsMemoryStore';
import { onReportEvents } from './onReportEvents';

const CONFIG: ReportsConfig = {
  utcOffset: '+10:00',
  financialYearStartMonth: 7,
  scoped: true,
  views: {},
  events: { packBuilt: { allowedDimensions: ['outcome'], maxCellsPerBucket: 50 } },
};

const rendered = (at: string, dimensions: Record<string, string> = { outcome: 'ok' }): ReportQueuedEvent => ({
  type: 'documentRendered',
  at: at as ReportQueuedEvent['at'],
  utcOffset: '+10:00',
  dimensions,
  measures: { pages: 2 },
});

const queueEvent = (id: string, payload: unknown, groupId = 'TENANT#t1/documentRendered'): QueueEvent<QueueMessage<unknown>> => ({
  id,
  groupId,
  message: { type: REPORT_EVENTS_MESSAGE_TYPE, payload },
});

const deliver = (store: ReturnType<typeof createReportsMemoryStore>, event: QueueEvent<QueueMessage<unknown>>) => {
  const logs: { logLevel: LogLevelEnum; msg: string }[] = [];
  let guids = 0;

  const handled = runStory(onReportEvents(event), {
    ...store.mocks,
    [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) =>
      action.payload.globalName === REPORT_NAME_GLOBAL ? 'docgen' : action.payload.globalName === reportConfigGlobal('docgen') ? CONFIG : undefined,
    [DateActionType.Now]: '2026-11-09T06:00:00.000Z',
    [GuidActionType.New]: () => `guid-${(guids += 1)}`,
    [GuidActionType.NewSortableMany]: (action: { payload: { count: number } }) =>
      Array.from({ length: action.payload.count }, () => `cmid-${(guids += 1)}`),
    [LogActionType.Create]: (action: { payload: { logLevel: LogLevelEnum; msg: string } }) => {
      logs.push(action.payload);
    },
  });

  return { handled, logs };
};

const message = (events: unknown[], type = 'documentRendered') => ({ scope: 'TENANT#t1', type, events });

describe('onReportEvents', () => {
  it("creates the month's document under its derived id on its first event, then appends the stamped events under the message id", () => {
    const store = createReportsMemoryStore('docgen');
    const { handled } = deliver(store, queueEvent('m1', message([rendered('2026-11-08T00:10:00.000Z')])));
    const log = store.logRows('TENANT#t1');

    expect(handled).toBe(true);
    expect(log.map((row) => [row.pk, row.sk, row.data.type])).toEqual([
      ['documentRendered~2026-11', 0, EventDocEffect.InitState],
      ['documentRendered~2026-11', 1, ReportMonthEffect.AppendEvents],
    ]);
    expect(log[1]!.data.payload.metadata).toMatchObject({ clientMessageId: 'm1', createdBy: { userId: REPORT_SYSTEM_USER_ID } });
    expect(log[1]!.data.payload.data).toEqual({
      limits: { maxCellsPerBucket: 200, maxDimensionNames: 32, maxMeasureNames: 32 },
      events: [{ ...rendered('2026-11-08T00:10:00.000Z'), bucketKeys: { hour: '2026-11-08T10:00', day: '2026-11-08', month: '2026-11' } }],
    });
    expect([...store.rows.values()].find((row) => row.store === 'docgenReports')).toMatchObject({
      id: 'documentRendered~2026-11',
      code: 'documentRendered/2026-11',
      scope: 'TENANT#t1',
    });
  });

  it('appends a message SQS delivers again only once, even after later messages and out of order', () => {
    const store = createReportsMemoryStore('docgen');
    const first = queueEvent('m1', message([rendered('2026-11-08T00:10:00.000Z')]));

    deliver(store, first);
    deliver(store, queueEvent('m2', message([rendered('2026-11-08T00:20:00.000Z')])));
    deliver(store, first);
    deliver(store, queueEvent('m2', message([rendered('2026-11-08T00:20:00.000Z')])));

    expect(
      store
        .logRows('TENANT#t1')
        .map((row) => row.data.payload.metadata.clientMessageId)
        .slice(1),
    ).toEqual(['m1', 'm2']);
  });

  it('splits a message straddling a month end across both documents', () => {
    const store = createReportsMemoryStore('docgen');

    deliver(store, queueEvent('m1', message([rendered('2026-10-31T13:30:00.000Z'), rendered('2026-10-31T14:30:00.000Z')])));

    expect([...new Set(store.logRows('TENANT#t1').map((row) => row.pk))]).toEqual(['documentRendered~2026-10', 'documentRendered~2026-11']);
  });

  it("applies the type's allowed dimensions and caps, and drops malformed events with one warning", () => {
    const store = createReportsMemoryStore('docgen');
    const pack = { ...rendered('2026-11-08T00:10:00.000Z', { outcome: 'ok', userEmail: 'a@b.c' }), type: 'packBuilt' };
    const { logs } = deliver(store, queueEvent('m1', message([pack, { type: 'packBuilt' }], 'packBuilt'), 'TENANT#t1/packBuilt'));
    const append = store.logRows('TENANT#t1')[1]!.data.payload.data;

    expect(append.events.map((event: ReportQueuedEvent) => event.dimensions)).toEqual([{ outcome: 'ok' }]);
    expect(append.limits.maxCellsPerBucket).toBe(50);
    expect(logs).toEqual([{ logLevel: LogLevelEnum.Warn, msg: expect.stringContaining("dropped 1 of 2 'packBuilt' event(s) in message m1") }]);
  });

  // Security regression: the FIFO group is the lane one writer owns; a payload naming another scope in it is refused.
  it('refuses a message whose group is not its scope and type, writing nothing', () => {
    const store = createReportsMemoryStore('docgen');
    const { handled, logs } = deliver(store, queueEvent('m1', message([rendered('2026-11-08T00:10:00.000Z')]), 'TENANT#t2/documentRendered'));

    expect(handled).toBe(true);
    expect(store.rows.size).toBe(0);
    expect(logs).toEqual([{ logLevel: LogLevelEnum.Error, msg: expect.stringContaining('refused message m1') }]);
  });

  it('folds an unscoped message unscoped', () => {
    const store = createReportsMemoryStore('docgen');

    deliver(store, queueEvent('m1', { ...message([rendered('2026-11-08T00:10:00.000Z')]), scope: null }, 'unscoped/documentRendered'));

    expect(store.logRows(undefined).map((row) => row.data.type)).toEqual([EventDocEffect.InitState, ReportMonthEffect.AppendEvents]);
    expect(store.logRows('TENANT#t1')).toHaveLength(0);
  });
});
