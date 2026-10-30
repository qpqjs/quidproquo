import { QpqRuntimeType } from '@qpqjs/core';

/** One admin log search: the window, the runtime type and the column filters, plus the page to continue from. */
export type LogSearchQuery = {
  runtimeType: QpqRuntimeType;
  startIsoDateTime: string;
  endIsoDateTime: string;

  errorFilter: string;
  serviceFilter: string;
  infoFilter: string;
  userFilter: string;
  onlyErrors: boolean;

  nextPageKey?: string;
};

/** A log search that also greps the redacted log text for `deep` (empty = no deep filter). */
export type LogDeepSearchQuery = LogSearchQuery & {
  deep: string;
};
