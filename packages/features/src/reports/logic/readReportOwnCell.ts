import { ReportCell } from '../models/ReportCell';

/** `record[key]` when the record holds it itself; never a value inherited from Object.prototype, whatever the key. */
export const readReportOwnCell = (record: Record<string, ReportCell>, key: string): ReportCell | undefined =>
  Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;
