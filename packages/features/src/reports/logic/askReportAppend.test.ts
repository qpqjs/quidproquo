import {
  askStorageScopeProvide,
  ConfigActionType,
  DateActionType,
  EventBusActionType,
  GuidActionType,
  LogActionType,
  LogLevelEnum,
} from '@qpqjs/core';
import { runStory, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { reportConfigGlobal } from '../constants/reportConfigGlobal';
import { REPORT_EVENTS_MESSAGE_TYPE } from '../constants/reportEventsMessageType';
import { ReportEvent } from '../models/ReportEvent';
import { ReportsConfig } from '../models/ReportsConfig';
import { askReportAppend } from './askReportAppend';

const NOW = '2026-11-09T05:12:40.118Z';
const CONFIG: ReportsConfig = { utcOffset: '+10:00', financialYearStartMonth: 7, scoped: true, views: {}, events: {} };

type Sent = { eventBusName: string; eventBusMessages: { type: string; payload: unknown; groupId: string; deduplicationId: string }[] };

const run = (story: Parameters<typeof runStory>[0], sendMock?: unknown) => {
  const sent: Sent[] = [];
  const logs: { logLevel: string; msg: string }[] = [];

  runStory(story, {
    [ConfigActionType.GetGlobal]: (action: { payload: { globalName: string } }) =>
      action.payload.globalName === reportConfigGlobal('docgen') ? CONFIG : undefined,
    [DateActionType.Now]: NOW,
    [GuidActionType.NewSortableMany]: (action: { payload: { count: number } }) =>
      Array.from({ length: action.payload.count }, (_, index) => `dedup-${index}`),
    [EventBusActionType.SendMessage]:
      sendMock ??
      ((action: { payload: Sent }) => {
        sent.push(action.payload);
      }),
    [LogActionType.Create]: (action: { payload: { logLevel: string; msg: string } }) => {
      logs.push(action.payload);
    },
  });

  return { sent, logs };
};

const rendered: ReportEvent = { type: 'documentRendered', dimensions: { templateKind: 'docx', outcome: 'ok' }, measures: { pages: 4 } };

describe('askReportAppend', () => {
  it("sends one message per event type, each in its scope and type's FIFO group, stamped with now and the report's offset", () => {
    const events: ReportEvent[] = [
      rendered,
      { ...rendered, at: '2026-11-08T00:00:00.000Z', measures: undefined },
      { type: 'packBuilt', dimensions: {} },
    ];
    const { sent } = run(askStorageScopeProvide('TENANT#t1', askReportAppend('docgen', events)));

    expect(sent).toHaveLength(1);
    expect(sent[0]!.eventBusName).toBe('docgenReportEvents');
    expect(sent[0]!.eventBusMessages).toEqual([
      {
        type: REPORT_EVENTS_MESSAGE_TYPE,
        payload: {
          scope: 'TENANT#t1',
          type: 'documentRendered',
          events: [
            { type: 'documentRendered', at: NOW, utcOffset: '+10:00', dimensions: { templateKind: 'docx', outcome: 'ok' }, measures: { pages: 4 } },
            {
              type: 'documentRendered',
              at: '2026-11-08T00:00:00.000Z',
              utcOffset: '+10:00',
              dimensions: { templateKind: 'docx', outcome: 'ok' },
              measures: {},
            },
          ],
        },
        groupId: 'TENANT#t1/documentRendered',
        deduplicationId: 'dedup-0',
      },
      {
        type: REPORT_EVENTS_MESSAGE_TYPE,
        payload: {
          scope: 'TENANT#t1',
          type: 'packBuilt',
          events: [{ type: 'packBuilt', at: NOW, utcOffset: '+10:00', dimensions: {}, measures: {} }],
        },
        groupId: 'TENANT#t1/packBuilt',
        deduplicationId: 'dedup-1',
      },
    ]);
  });

  it("counts at the caller's offset when it passes one, and travels in the unscoped group when appended unscoped", () => {
    const { sent } = run(askReportAppend('docgen', rendered, { utcOffset: '+08:00' }));
    const [message] = sent[0]!.eventBusMessages;

    expect(message!.groupId).toBe('unscoped/documentRendered');
    expect((message!.payload as { scope: unknown; events: { utcOffset: string }[] }).scope).toBeNull();
    expect((message!.payload as { events: { utcOffset: string }[] }).events[0]!.utcOffset).toBe('+08:00');
  });

  it('throws Invalid in the caller, naming the problem, for a malformed event, and sends nothing', () => {
    const sent: Sent[] = [];

    expect(() =>
      runStory(askReportAppend('docgen', [rendered, { ...rendered, type: 'bad/type' }]), {
        [ConfigActionType.GetGlobal]: CONFIG,
        [DateActionType.Now]: NOW,
        [EventBusActionType.SendMessage]: (action: { payload: Sent }) => {
          sent.push(action.payload);
        },
      }),
    ).toThrowError(/Invalid: askReportAppend\('docgen'\): type must start with a letter/);
    expect(sent).toHaveLength(0);
  });

  it("throws Invalid for an event dated more than five minutes ahead, so a bad `at` is the caller's to hear about", () => {
    expect(() =>
      runStory(askReportAppend('docgen', { ...rendered, at: '2026-11-09T06:00:00.000Z' }), {
        [ConfigActionType.GetGlobal]: CONFIG,
        [DateActionType.Now]: NOW,
      }),
    ).toThrowError(/Invalid: askReportAppend\('docgen'\): at 2026-11-09T06:00:00.000Z is more than 5 minutes after now/);
  });

  it('logs a failed send at error and returns, so the thing being counted never fails because of the count', () => {
    const { logs } = run(askReportAppend('docgen', rendered), throwsError('Throttled', 'slow down'));

    expect(logs).toEqual([
      { logLevel: LogLevelEnum.Error, msg: expect.stringContaining('docgen: lost 1 event(s) of documentRendered, the send failed: slow down') },
    ]);
  });
});
