import type { LogSearchQuery } from './LogSearchQuery';

/** A log search that also greps the redacted log text for `deep` (empty = no deep filter). */
export type LogDeepSearchQuery = LogSearchQuery & {
  deep: string;
};
