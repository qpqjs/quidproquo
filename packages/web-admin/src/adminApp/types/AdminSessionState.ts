import { Nullable } from '@qpqjs/core';
import { EventDocDocument } from '@qpqjs/features';

import { AdminSessionSearchRequestedData } from '../effects/session/AdminSessionSearchRequestedEffect';
import { AdminSearchParams } from './AdminSearchParams';
import { SessionSeededParams } from './SessionSeededParams';

// The folded session, NEVER stored; always derived by folding the event log
// (saved + pending) through adminSessionFoldReducer. Replaying the same log
// reproduces this state exactly.
export type AdminSessionState = EventDocDocument & {
  username: string;
  seededParams: SessionSeededParams;
  tab: number;
  search: AdminSearchParams;
  lastSearchRequest: Nullable<AdminSessionSearchRequestedData>;
  openCorrelation: Nullable<string>;
  logChecks: Record<string, boolean>;
  configSelectedService: string;
  chatMessageCounts: Record<string, number>;
  endedAt: Nullable<string>;
};
