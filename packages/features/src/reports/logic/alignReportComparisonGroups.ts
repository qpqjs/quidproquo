import { createEmptyReportCell } from '../fold/logic/createEmptyReportCell';
import { ReportCell } from '../models/ReportCell';
import { ReportReadGroup } from '../models/ReportReadGroup';
import { readReportOwnCell } from './readReportOwnCell';

/**
 * A comparison's groups lined up with the answer's, as the register does: the answer's values in its order, so a widget
 * reads `groups[i]` against `comparison.groups[i]`; a value the earlier period has nothing for counts 0, and one only the
 * earlier period has is left out, with no bar to sit beside.
 */
export const alignReportComparisonGroups = (groups: ReportReadGroup[], comparisonSeries: Record<string, ReportCell>): ReportReadGroup[] =>
  groups.map((group) => ({ value: group.value, ...(readReportOwnCell(comparisonSeries, group.value) ?? createEmptyReportCell()) }));
