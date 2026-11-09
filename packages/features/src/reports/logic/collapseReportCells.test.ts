import { describe, expect, it } from 'vitest';

import { REPORT_OTHER_CELL_KEY } from '../constants/reportOtherCellKey';
import { ReportCell } from '../models/ReportCell';
import { collapseReportCells } from './collapseReportCells';

const cell = (count: number, pages?: [number, number, number]): ReportCell => ({
  count,
  sums: pages ? { pages: pages[0] } : {},
  mins: pages ? { pages: pages[1] } : {},
  maxes: pages ? { pages: pages[2] } : {},
});

const CELLS = {
  'outcome=ok|templateKind=docx': cell(3, [6, 1, 3]),
  'outcome=failed|templateKind=docx': cell(1, [9, 9, 9]),
  'outcome=ok|templateKind=pdf': cell(2, [4, 2, 2]),
  'outcome=ok': cell(1),
  [REPORT_OTHER_CELL_KEY]: cell(5, [10, 1, 4]),
};

describe('collapseReportCells', () => {
  it('adds every cell into the total and each tuple into its groupBy series; the other cell joins the total only', () => {
    const collapsed = collapseReportCells(CELLS, { groupBy: 'templateKind' });

    expect(collapsed.total).toEqual(cell(12, [29, 1, 9]));
    expect(collapsed.series).toEqual({ docx: cell(4, [15, 1, 9]), pdf: cell(2, [4, 2, 2]) });
    expect(collapsed.hasOther).toBe(true);
  });

  it('keeps only tuples matching the filter, so the other cell, whose tuples are unknown, is left out', () => {
    const collapsed = collapseReportCells(CELLS, { filter: { outcome: 'ok' }, groupBy: 'templateKind' });

    expect(collapsed.total).toEqual(cell(6, [10, 1, 3]));
    expect(collapsed.series).toEqual({ docx: cell(3, [6, 1, 3]), pdf: cell(2, [4, 2, 2]) });
  });

  it('compares values as text, and never matches a name only Object.prototype has', () => {
    expect(collapseReportCells({ 'pages=4': cell(1) }, { filter: { pages: 4 } }).total.count).toBe(1);
    expect(collapseReportCells(CELLS, { filter: { constructor: 'x' } }).total.count).toBe(0);
  });
});
