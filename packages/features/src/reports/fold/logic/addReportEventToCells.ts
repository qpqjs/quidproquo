import { REPORT_OTHER_CELL_KEY } from '../../constants/reportOtherCellKey';
import { ReportCells } from '../../models/ReportCells';
import { ReportMeasures } from '../../models/ReportMeasures';
import { addReportMeasuresToCell } from './addReportMeasuresToCell';
import { createEmptyReportCell } from './createEmptyReportCell';

/**
 * A bucket's cells with one event counted under its tuple's cell. A tuple new to a bucket already holding
 * `maxCellsPerBucket` tuples is counted in the `other` cell instead, so a high-cardinality dimension value cannot grow
 * the number of cells in a bucket. The name caps in applyReportEvent bound what goes inside each cell.
 */
export const addReportEventToCells = (cells: ReportCells, cellKey: string, measures: ReportMeasures, maxCellsPerBucket: number): ReportCells => {
  const hasCell = Object.prototype.hasOwnProperty.call(cells, cellKey);
  const tupleCellCount = Object.keys(cells).filter((key) => key !== REPORT_OTHER_CELL_KEY).length;
  const key = hasCell || tupleCellCount < maxCellsPerBucket ? cellKey : REPORT_OTHER_CELL_KEY;
  const cell = Object.prototype.hasOwnProperty.call(cells, key) ? cells[key] : undefined;

  return { ...cells, [key]: addReportMeasuresToCell(cell ?? createEmptyReportCell(), measures) };
};
