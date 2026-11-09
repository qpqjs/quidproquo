import { Nullable } from '@qpqjs/core';

/** The local days a read counts, inclusive, and for today against yesterday the last local hour counted. */
export type ReportSpan = {
  from: string;
  to: string;
  lastHour: Nullable<number>;
};
