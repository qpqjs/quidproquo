import { ReportCell } from '../../models/ReportCell';
import { ReportMeasures } from '../../models/ReportMeasures';
import { readReportOwnNumber } from './readReportOwnNumber';

/** A cell with one more event counted: its measures added to the sums and folded into the smallest and largest seen. */
export const addReportMeasuresToCell = (cell: ReportCell, measures: ReportMeasures): ReportCell => {
  const entries = Object.entries(measures);

  return {
    count: cell.count + 1,
    sums: { ...cell.sums, ...Object.fromEntries(entries.map(([name, value]) => [name, (readReportOwnNumber(cell.sums, name) ?? 0) + value])) },
    mins: {
      ...cell.mins,
      ...Object.fromEntries(entries.map(([name, value]) => [name, Math.min(readReportOwnNumber(cell.mins, name) ?? value, value)])),
    },
    maxes: {
      ...cell.maxes,
      ...Object.fromEntries(entries.map(([name, value]) => [name, Math.max(readReportOwnNumber(cell.maxes, name) ?? value, value)])),
    },
  };
};
