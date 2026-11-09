import { readReportOwnNumber } from '../fold/logic/readReportOwnNumber';
import { ReportCell } from '../models/ReportCell';

const addMeasures = (a: Record<string, number>, b: Record<string, number>): Record<string, number> => ({
  ...a,
  ...Object.fromEntries(Object.entries(b).map(([name, value]) => [name, (readReportOwnNumber(a, name) ?? 0) + value])),
});

const keepMeasures = (a: Record<string, number>, b: Record<string, number>, pick: (x: number, y: number) => number): Record<string, number> => ({
  ...a,
  ...Object.fromEntries(Object.entries(b).map(([name, value]) => [name, pick(readReportOwnNumber(a, name) ?? value, value)])),
});

/** Two cells as one: counts and sums added, the smallest and largest kept. A measure neither has stays absent. */
export const mergeReportCell = (a: ReportCell, b: ReportCell): ReportCell => ({
  count: a.count + b.count,
  sums: addMeasures(a.sums, b.sums),
  mins: keepMeasures(a.mins, b.mins, Math.min),
  maxes: keepMeasures(a.maxes, b.maxes, Math.max),
});
