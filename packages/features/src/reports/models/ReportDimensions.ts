import { ReportDimensionValue } from './ReportDimensionValue';

/** The categories a report event is counted under, any keys; a view groups and filters by them. */
export type ReportDimensions = Record<string, ReportDimensionValue>;
