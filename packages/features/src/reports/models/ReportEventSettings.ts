/** Per event type settings; an event type with no entry gets the defaults. Every cap is a failsafe that ordinary categories never reach. */
export type ReportEventSettings = {
  retentionMonths?: number;
  // Distinct dimension tuples per hour or day bucket before further tuples land in the `other` cell.
  maxCellsPerBucket?: number;
  // Distinct dimension names per month before an event bringing a new one lands in the `other` cell.
  maxDimensionNames?: number;
  // Distinct measure names per month before a new one is no longer counted.
  maxMeasureNames?: number;
  // When set, the consumer drops every other dimension key for this type.
  allowedDimensions?: string[];
};
