/** The running totals for one dimension tuple in one bucket. A measure no event in the cell carried is absent, never 0. */
export type ReportCell = {
  count: number;
  sums: Record<string, number>;
  mins: Record<string, number>;
  maxes: Record<string, number>;
};
