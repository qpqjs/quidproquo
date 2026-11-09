/** The local hour, day and month an event is counted in, worked out once when it is stored. */
export type ReportBucketKeys = {
  // `YYYY-MM-DDTHH:00`
  hour: string;
  // `YYYY-MM-DD`
  day: string;
  // `YYYY-MM`
  month: string;
};
