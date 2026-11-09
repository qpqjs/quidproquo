import { createEmptyReportCell } from '../fold/logic/createEmptyReportCell';
import { ReportCell } from '../models/ReportCell';
import { mergeReportCell } from './mergeReportCell';
import { readReportOwnCell } from './readReportOwnCell';

/** Two sets of series (or of cells) as one, cell by cell. */
export const mergeReportSeries = (a: Record<string, ReportCell>, b: Record<string, ReportCell>): Record<string, ReportCell> => ({
  ...a,
  ...Object.fromEntries(Object.entries(b).map(([key, cell]) => [key, mergeReportCell(readReportOwnCell(a, key) ?? createEmptyReportCell(), cell)])),
});
