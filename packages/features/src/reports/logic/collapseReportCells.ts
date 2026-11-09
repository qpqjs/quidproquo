import { REPORT_OTHER_CELL_KEY } from '../constants/reportOtherCellKey';
import { createEmptyReportCell } from '../fold/logic/createEmptyReportCell';
import { ReportCell } from '../models/ReportCell';
import { ReportCells } from '../models/ReportCells';
import { ReportViewDefinition } from '../models/ReportViewDefinition';
import { ReportCollapsedCells } from '../types/ReportCollapsedCells';
import { mergeReportCell } from './mergeReportCell';
import { mergeReportSeries } from './mergeReportSeries';
import { parseReportCellKey } from './parseReportCellKey';

type CollapseView = Pick<ReportViewDefinition, 'filter' | 'groupBy'>;

const hasOwn = (record: object, key: string): boolean => Object.prototype.hasOwnProperty.call(record, key);

// Values are compared as text, as they were keyed.
const matchesFilter = (tuple: Record<string, string>, filter: CollapseView['filter']): boolean =>
  Object.entries(filter ?? {}).every(([name, value]) => hasOwn(tuple, name) && tuple[name] === String(value));

const collapseCell = (collapsed: ReportCollapsedCells, cellKey: string, cell: ReportCell, view: CollapseView): ReportCollapsedCells => {
  // Which tuples an `other` cell holds is not known: it counts toward an unfiltered total only, never a series.
  if (cellKey === REPORT_OTHER_CELL_KEY) {
    return { ...collapsed, hasOther: true, total: view.filter ? collapsed.total : mergeReportCell(collapsed.total, cell) };
  }

  const tuple = parseReportCellKey(cellKey);

  if (!matchesFilter(tuple, view.filter)) {
    return collapsed;
  }

  const value = view.groupBy !== undefined && hasOwn(tuple, view.groupBy) ? tuple[view.groupBy] : undefined;

  return {
    ...collapsed,
    total: mergeReportCell(collapsed.total, cell),
    series: value === undefined ? collapsed.series : mergeReportSeries(collapsed.series, { [value]: cell }),
  };
};

/**
 * One hour's or day's cells reduced to a view: the cells whose tuple matches its filter added into one total, and with a
 * groupBy into one series per value. A tuple without the groupBy dimension counts in the total but no series.
 */
export const collapseReportCells = (cells: ReportCells, view: CollapseView): ReportCollapsedCells =>
  Object.entries(cells).reduce<ReportCollapsedCells>((collapsed, [cellKey, cell]) => collapseCell(collapsed, cellKey, cell, view), {
    total: createEmptyReportCell(),
    series: {},
    hasOther: false,
  });
