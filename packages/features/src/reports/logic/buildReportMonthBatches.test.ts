import { describe, expect, it } from 'vitest';

import { ReportEventsMessage } from '../models/ReportEventsMessage';
import { ReportQueuedEvent } from '../models/ReportQueuedEvent';
import { buildReportMonthBatches } from './buildReportMonthBatches';
import { resolveReportMonthLimits } from './resolveReportMonthLimits';

const rendered = (at: string, dimensions: Record<string, string> = { outcome: 'ok' }): ReportQueuedEvent => ({
  type: 'documentRendered',
  at: at as ReportQueuedEvent['at'],
  utcOffset: '+10:00',
  dimensions,
  measures: {},
});

const message = (events: unknown[]): ReportEventsMessage => ({ scope: 'TENANT#t1', type: 'documentRendered', events: events as ReportQueuedEvent[] });

describe('buildReportMonthBatches', () => {
  it('stamps each event with its local keys and splits the message by month document, in month order', () => {
    // 23:30 on 31 October and 00:30 on 1 November at +10:00.
    const batches = buildReportMonthBatches(message([rendered('2026-10-31T14:30:00.000Z'), rendered('2026-10-31T13:30:00.000Z')]));

    expect(batches.months.map((month) => [month.docId, month.code, month.events.length])).toEqual([
      ['documentRendered~2026-10', 'documentRendered/2026-10', 1],
      ['documentRendered~2026-11', 'documentRendered/2026-11', 1],
    ]);
    expect(batches.months[0]!.events[0]!.bucketKeys).toEqual({ hour: '2026-10-31T23:00', day: '2026-10-31', month: '2026-10' });
    expect(batches.droppedCount).toBe(0);
    expect(batches.dropReason).toBeNull();
  });

  it('drops malformed events and events of another type, counting them and keeping the first reason', () => {
    const batches = buildReportMonthBatches(
      message([rendered('2026-11-08T00:00:00.000Z'), { ...rendered('2026-11-08T00:00:00.000Z'), type: 'packBuilt' }, { type: 'documentRendered' }]),
    );

    expect(batches.months.map((month) => month.events.length)).toEqual([1]);
    expect(batches.droppedCount).toBe(2);
    expect(batches.dropReason).toContain("another type in a 'documentRendered' message");
  });

  it("keeps only the type's allowed dimensions when it has a closed set", () => {
    const batches = buildReportMonthBatches(message([rendered('2026-11-08T00:00:00.000Z', { outcome: 'ok', userEmail: 'a@b.c' })]), {
      allowedDimensions: ['outcome'],
    });

    expect(batches.months[0]!.events[0]!.dimensions).toEqual({ outcome: 'ok' });
  });
});

describe('resolveReportMonthLimits', () => {
  it("takes the type's caps where it names them and the defaults elsewhere", () => {
    expect(resolveReportMonthLimits()).toEqual({ maxCellsPerBucket: 200, maxDimensionNames: 32, maxMeasureNames: 32 });
    expect(resolveReportMonthLimits({ maxCellsPerBucket: 500 })).toEqual({ maxCellsPerBucket: 500, maxDimensionNames: 32, maxMeasureNames: 32 });
  });
});
