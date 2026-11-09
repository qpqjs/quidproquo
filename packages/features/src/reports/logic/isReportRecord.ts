/** Whether a value is a plain object a report declaration can hold fields on (not null, not an array). */
export const isReportRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
