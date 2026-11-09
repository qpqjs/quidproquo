/** The caps a batch is folded under, resolved by the consumer from the event type's settings and stored with the batch. */
export type ReportMonthLimits = {
  // Distinct dimension tuples per hour or day bucket; a further tuple is counted in the `other` cell.
  maxCellsPerBucket: number;
  // Distinct dimension names per month document; an event bringing a name past it is counted in the `other` cell.
  maxDimensionNames: number;
  // Distinct measure names per month document; a measure name past it is not counted.
  maxMeasureNames: number;
};
