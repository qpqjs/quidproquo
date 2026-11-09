/** `record[key]` when the record holds it itself; never a value inherited from Object.prototype, whatever `key` is. */
export const readReportOwnNumber = (record: Record<string, number>, key: string): number | undefined =>
  Object.prototype.hasOwnProperty.call(record, key) ? record[key] : undefined;
