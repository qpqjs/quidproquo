import { createEventDocInitialDocumentState, EventDocDocument } from 'quidproquo-features';

import { adminSessionSchemaVersion } from './constants/adminSessionSchemaVersion';
import { SearchRequestedData } from './effects/session/SearchRequestedEvent';
import { AdminSearchParams } from './types/AdminSearchParams';
import { SessionSeededParams } from './types/SessionSeededParams';

// The folded session — NEVER stored; always derived by folding the event log
// (saved + pending) through adminSessionFoldReducer. Replaying the same log
// reproduces this state exactly.
export type AdminSessionState = EventDocDocument & {
  username: string;
  seededParams: SessionSeededParams;
  tab: number;
  search: AdminSearchParams;
  lastSearchRequest: SearchRequestedData | null;
  openCorrelation: string | null;
  logChecks: Record<string, boolean>;
  configSelectedService: string;
  chatMessageCounts: Record<string, number>;
  endedAt: string | null;
};

export const createDefaultAdminSearchParams = (): AdminSearchParams => ({
  runtimeType: '',
  service: '',
  startIsoDateTime: '',
  endIsoDateTime: '',
  user: '',
  info: '',
  msg: '',
  error: '',
  deep: '',
  logLevel: '',
});

export const createInitialAdminSessionState = (): AdminSessionState => ({
  ...createEventDocInitialDocumentState(adminSessionSchemaVersion),
  username: '',
  seededParams: {},
  tab: 0,
  search: createDefaultAdminSearchParams(),
  lastSearchRequest: null,
  openCorrelation: null,
  logChecks: {},
  configSelectedService: '',
  chatMessageCounts: {},
  endedAt: null,
});
