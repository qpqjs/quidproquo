import { ReportMeasures } from '../../models/ReportMeasures';
import { mergeReportKeys } from './mergeReportKeys';

/** An event's measures with any name past the month's cap left out, and the month's measure names with the kept ones added. */
export type KeptReportMeasures = {
  measures: ReportMeasures;
  measureKeys: string[];
};

/**
 * Keeps every measure whose name the month already counts, and admits new names in name order while the month has room
 * for them. A name past `maxMeasureNames` is left out of this event and of every cell, so it cannot grow the state.
 */
export const keepReportMeasures = (measures: ReportMeasures, measureKeys: string[], maxMeasureNames: number): KeptReportMeasures => {
  const known = new Set(measureKeys);
  const admitted = new Set(
    Object.keys(measures)
      .filter((name) => !known.has(name))
      .sort()
      .slice(0, Math.max(0, maxMeasureNames - measureKeys.length)),
  );

  return {
    measures: Object.fromEntries(Object.entries(measures).filter(([name]) => known.has(name) || admitted.has(name))),
    measureKeys: mergeReportKeys(measureKeys, [...admitted]),
  };
};
