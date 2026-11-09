import { ReportCell } from './ReportCell';

/** One bucket's cells, keyed by reportCellKey of the dimension tuple, or REPORT_OTHER_CELL_KEY once the bucket is at its cap. */
export type ReportCells = Record<string, ReportCell>;
