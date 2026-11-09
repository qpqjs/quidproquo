import { ReportCell } from '../../models/ReportCell';

/** A cell nothing has been counted in yet. */
export const createEmptyReportCell = (): ReportCell => ({ count: 0, sums: {}, mins: {}, maxes: {} });
