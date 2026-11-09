import { getUtcOffsetMinutes, UtcOffset } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { REPORT_OTHER_CELL_KEY } from '../../constants/reportOtherCellKey';
import { reportBucketKeys } from '../../logic/reportBucketKeys';
import { ReportStoredEvent } from '../../models/ReportStoredEvent';
import { applyReportEvents } from './applyReportEvents';
import { createInitialReportMonthDocument } from './createInitialReportMonthDocument';

// A stored event, its keys stamped the way the consumer stamps them.
const rendered = (
  at: string,
  dimensions: ReportStoredEvent['dimensions'],
  measures: ReportStoredEvent['measures'] = {},
  utcOffset: UtcOffset = '+10:00',
): ReportStoredEvent => ({
  type: 'documentRendered',
  at: at as ReportStoredEvent['at'],
  utcOffset,
  bucketKeys: reportBucketKeys(at as ReportStoredEvent['at'], getUtcOffsetMinutes(utcOffset) ?? 0),
  dimensions,
  measures,
});

const LIMITS = { maxCellsPerBucket: 200, maxDimensionNames: 32, maxMeasureNames: 32 };

describe('applyReportEvents', () => {
  it('counts an event in its stamped local hour and day', () => {
    // 23:30 on 31 October at +10:00.
    const state = applyReportEvents(createInitialReportMonthDocument(), [rendered('2026-10-31T13:30:00.000Z', { outcome: 'ok' })], LIMITS);

    expect(Object.keys(state.daily)).toEqual(['2026-10-31']);
    expect(Object.keys(state.hourly)).toEqual(['2026-10-31T23:00']);
    expect(state.daily['2026-10-31']!['outcome=ok']!.count).toBe(1);
    expect(state.newestAt).toBe('2026-10-31T13:30:00.000Z');
    expect(state.newestDay).toBe('2026-10-31');
  });

  it('counts where the stamped keys say, never re-deriving them from the instant', () => {
    const event = { ...rendered('2026-11-01T14:30:00.000Z', {}), bucketKeys: { hour: '2026-11-05T09:00', day: '2026-11-05', month: '2026-11' } };
    const state = applyReportEvents(createInitialReportMonthDocument(), [event], LIMITS);

    expect(Object.keys(state.daily)).toEqual(['2026-11-05']);
    expect(Object.keys(state.hourly)).toEqual(['2026-11-05T09:00']);
  });

  it('folds the same events to the same state whether they arrive in one batch or two', () => {
    const events = [
      rendered('2026-11-07T00:10:00.000Z', { outcome: 'ok', templateKind: 'docx' }, { pages: 4 }),
      rendered('2026-11-08T00:10:00.000Z', { outcome: 'failed', templateKind: 'pdf' }),
      rendered('2026-11-08T03:10:00.000Z', { templateKind: 'docx', outcome: 'ok' }, { pages: 2 }),
      rendered('2026-11-08T22:40:00.000Z', { outcome: 'ok', templateKind: 'pdf' }, { pages: 9 }),
    ];
    const once = applyReportEvents(createInitialReportMonthDocument(), events, LIMITS);
    const twice = applyReportEvents(applyReportEvents(createInitialReportMonthDocument(), events.slice(0, 2), LIMITS), events.slice(2), LIMITS);

    expect(twice).toEqual(once);
  });

  it('counts the same tuple in one cell whatever order its dimensions were written in', () => {
    const state = applyReportEvents(
      createInitialReportMonthDocument(),
      [rendered('2026-11-08T00:10:00.000Z', { a: 1, b: 'x' }), rendered('2026-11-08T00:20:00.000Z', { b: 'x', a: 1 })],
      LIMITS,
    );

    expect(state.daily['2026-11-08']).toEqual({ 'a=1|b=x': { count: 2, sums: {}, mins: {}, maxes: {} } });
  });

  it('counts a tuple new to a bucket at its cap in the other cell, and keeps counting tuples it already holds', () => {
    const at = '2026-11-08T00:10:00.000Z';
    const state = applyReportEvents(
      createInitialReportMonthDocument(),
      [
        rendered(at, { user: 'a' }),
        rendered(at, { user: 'b' }),
        rendered(at, { user: 'c' }),
        rendered(at, { user: 'a' }),
        rendered(at, { user: 'd' }),
      ],
      { ...LIMITS, maxCellsPerBucket: 2 },
    );
    const day = state.daily['2026-11-08']!;

    expect(Object.keys(day).sort()).toEqual([REPORT_OTHER_CELL_KEY, 'user=a', 'user=b']);
    expect(day['user=a']!.count).toBe(2);
    expect(day[REPORT_OTHER_CELL_KEY]!.count).toBe(2);
  });

  it('keeps sum, smallest and largest per measure, and an event without the measure never drags the smallest to 0', () => {
    const at = '2026-11-08T00:10:00.000Z';
    const state = applyReportEvents(
      createInitialReportMonthDocument(),
      [
        rendered(at, { outcome: 'ok' }),
        rendered(at, { outcome: 'ok' }, { pages: 4 }),
        rendered(at, { outcome: 'ok' }, { pages: 2 }),
        rendered(at, { outcome: 'ok' }, { pages: 9 }),
      ],
      LIMITS,
    );

    expect(state.daily['2026-11-08']!['outcome=ok']).toEqual({ count: 4, sums: { pages: 15 }, mins: { pages: 2 }, maxes: { pages: 9 } });
  });

  it('never reads a measure named after an Object.prototype member as anything but the event itself', () => {
    const at = '2026-11-08T00:10:00.000Z';
    const state = applyReportEvents(
      createInitialReportMonthDocument(),
      [rendered(at, {}, { constructor: 3, toString: 1 }), rendered(at, {}, { constructor: 5 })],
      LIMITS,
    );
    const cell = state.daily['2026-11-08']!['']!;

    expect(cell.sums.constructor).toBe(8);
    expect(cell.mins.constructor).toBe(3);
    expect(cell.maxes.toString).toBe(1);
  });

  it('collects every dimension and measure key seen, sorted', () => {
    const state = applyReportEvents(
      createInitialReportMonthDocument(),
      [
        rendered('2026-11-08T00:10:00.000Z', { templateKind: 'docx' }, { renderMs: 800 }),
        rendered('2026-11-08T00:20:00.000Z', { outcome: 'ok' }, { pages: 3 }),
      ],
      LIMITS,
    );

    expect(state.dimensionKeys).toEqual(['outcome', 'templateKind']);
    expect(state.measureKeys).toEqual(['pages', 'renderMs']);
  });

  it("keeps hourly cells for the newest event's local day and the day before, and every day's daily cells", () => {
    // 10:00 on the 7th, 8th and 9th of November at +10:00.
    const state = applyReportEvents(
      createInitialReportMonthDocument(),
      [rendered('2026-11-07T00:00:00.000Z', {}), rendered('2026-11-08T00:00:00.000Z', {}), rendered('2026-11-09T00:00:00.000Z', {})],
      LIMITS,
    );

    expect(Object.keys(state.hourly).sort()).toEqual(['2026-11-08T10:00', '2026-11-09T10:00']);
    expect(Object.keys(state.daily).sort()).toEqual(['2026-11-07', '2026-11-08', '2026-11-09']);
  });

  it('does not move the newest event back for a late event', () => {
    const state = applyReportEvents(
      createInitialReportMonthDocument(),
      [rendered('2026-11-08T23:00:00.000Z', {}), rendered('2026-11-02T23:00:00.000Z', {})],
      LIMITS,
    );

    expect(state.newestAt).toBe('2026-11-08T23:00:00.000Z');
    expect(state.newestDay).toBe('2026-11-09');
    expect(state.daily['2026-11-03']!['']!.count).toBe(1);
  });

  it('keeps events stamped before an offset change on their own days through a refold', () => {
    // 14:30Z on 1 November is still the 1st at +00:00 but 00:30 on the 2nd at +10:00.
    const events = [rendered('2026-11-01T14:30:00.000Z', {}, {}, '+00:00'), rendered('2026-11-01T14:30:00.000Z', {}, {}, '+10:00')];
    const state = applyReportEvents(createInitialReportMonthDocument(), events, LIMITS);

    expect(Object.keys(state.daily).sort()).toEqual(['2026-11-01', '2026-11-02']);
    expect(applyReportEvents(createInitialReportMonthDocument(), events, LIMITS)).toEqual(state);
  });
  it('counts an event bringing a dimension name past the month cap in the other cell, and keeps counting known names', () => {
    const at = '2026-11-08T00:10:00.000Z';
    const limits = { ...LIMITS, maxDimensionNames: 2 };
    const state = applyReportEvents(
      createInitialReportMonthDocument(),
      [rendered(at, { a: 'x' }), rendered(at, { b: 'x' }), rendered(at, { c: 'x' }), rendered(at, { a: 'y' })],
      limits,
    );
    const day = state.daily['2026-11-08']!;

    expect(state.dimensionKeys).toEqual(['a', 'b']);
    expect(Object.keys(day).sort()).toEqual(['a=x', 'a=y', 'b=x', REPORT_OTHER_CELL_KEY]);
    expect(day[REPORT_OTHER_CELL_KEY]!.count).toBe(1);
    expect(state.namesCapped).toBe(true);
  });

  it('leaves a measure name past the month cap out of every cell, admitting new names in name order', () => {
    const at = '2026-11-08T00:10:00.000Z';
    const limits = { ...LIMITS, maxMeasureNames: 2 };
    const state = applyReportEvents(
      createInitialReportMonthDocument(),
      [rendered(at, {}, { pages: 1 }), rendered(at, {}, { renderMs: 5, bytes: 7, pages: 2 }), rendered(at, {}, { renderMs: 9 })],
      limits,
    );

    expect(state.measureKeys).toEqual(['bytes', 'pages']);
    expect(state.daily['2026-11-08']!['']).toEqual({
      count: 3,
      sums: { pages: 3, bytes: 7 },
      mins: { pages: 1, bytes: 7 },
      maxes: { pages: 2, bytes: 7 },
    });
    expect(state.namesCapped).toBe(true);
  });

  it('leaves namesCapped false while every name fits', () => {
    const state = applyReportEvents(
      createInitialReportMonthDocument(),
      [rendered('2026-11-08T00:10:00.000Z', { outcome: 'ok' }, { pages: 1 })],
      LIMITS,
    );

    expect(state.namesCapped).toBe(false);
  });
});
