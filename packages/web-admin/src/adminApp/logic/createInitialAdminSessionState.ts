import { createEventDocInitialDocumentState } from '@qpqjs/features';

import { adminSessionSchemaVersion } from '../constants/adminSessionSchemaVersion';
import { AdminSessionState } from '../types/AdminSessionState';
import { createDefaultAdminSearchParams } from './createDefaultAdminSearchParams';

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
