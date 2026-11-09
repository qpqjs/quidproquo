import { readReportOwnNumber } from '../fold/logic/readReportOwnNumber';
import { ReportCell } from '../models/ReportCell';
import { ReportReadGroup } from '../models/ReportReadGroup';

/** A span's groups, best first, cut to `groupLimit`, with how many there were when the cut dropped any. */
export type RankedReportGroups = {
  groups: ReportReadGroup[];
  groupsTotal?: number;
};

const score = (group: ReportReadGroup, measure: string | undefined): number =>
  measure === undefined ? group.count : (readReportOwnNumber(group.sums, measure) ?? 0);

const compareGroups = (a: ReportReadGroup, b: ReportReadGroup, measure: string | undefined): number =>
  score(b, measure) - score(a, measure) || (a.value < b.value ? -1 : a.value > b.value ? 1 : 0);

/** One group per groupBy value over a whole span, largest first by the view's measure sum (else by count), ties by value. */
export const rankReportGroups = (series: Record<string, ReportCell>, measure?: string, groupLimit?: number): RankedReportGroups => {
  const groups = Object.entries(series)
    .map(([value, cell]): ReportReadGroup => ({ value, ...cell }))
    .sort((a, b) => compareGroups(a, b, measure));

  return groupLimit !== undefined && groups.length > groupLimit ? { groups: groups.slice(0, groupLimit), groupsTotal: groups.length } : { groups };
};
