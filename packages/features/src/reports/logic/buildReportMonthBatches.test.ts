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

// The consumer's clock: 05:12Z on 9 November, so every event above is in the past.
const NOW = '2026-11-09T05:12:40.118Z';

const message = (events: unknown[]): ReportEventsMessage => ({ scope: 'TENANT#t1', type: 'documentRendered', events: events as ReportQueuedEvent[] });

describe('buildReportMonthBatches', () => {
  it('stamps each event with its local keys and splits the message by month document, in month order', () => {
    // 23:30 on 31 October and 00:30 on 1 November at +10:00.
    const batches = buildReportMonthBatches(message([rendered('2026-10-31T14:30:00.000Z'), rendered('2026-10-31T13:30:00.000Z')]), NOW);

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
      NOW,
    );

    expect(batches.months.map((month) => month.events.length)).toEqual([1]);
    expect(batches.droppedCount).toBe(2);
    expect(batches.dropReason).toContain("another type in a 'documentRendered' message");
  });

  it("drops an event dated more than five minutes ahead of the consumer's clock, keeping one just inside it", () => {
    const batches = buildReportMonthBatches(message([rendered('2026-11-09T05:17:00.000Z'), rendered('2026-11-09T05:30:00.000Z')]), NOW);

    expect(batches.months.flatMap((month) => month.events.map((event) => event.at))).toEqual(['2026-11-09T05:17:00.000Z']);
    expect(batches.droppedCount).toBe(1);
    expect(batches.dropReason).toContain('more than 5 minutes after now');
  });

  it("keeps only the type's allowed dimensions when it has a closed set", () => {
    const batches = buildReportMonthBatches(message([rendered('2026-11-08T00:00:00.000Z', { outcome: 'ok', userEmail: 'a@b.c' })]), NOW, {
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
