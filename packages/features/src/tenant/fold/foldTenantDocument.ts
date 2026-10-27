import { foldEventDocLog } from '../../eventDoc/fold/foldEventDocLog';
import { EventDocEvent } from '../../eventDoc/models';
import { TenantDocument } from '../models/TenantDocument';
import { createInitialTenantDocumentState } from './createInitialTenantDocumentState';
import { tenantDocumentFoldReducer } from './tenantDocumentFoldReducer';

// Fold a tenant's full event log into its current document (identity/lifecycle
// from the reserved base effects, branding from SET_BRAND). Version 1, no
// migrations yet.
export const foldTenantDocument = (events: EventDocEvent[]): TenantDocument =>
  foldEventDocLog(events, {
    seed: createInitialTenantDocumentState(),
    reducer: tenantDocumentFoldReducer,
    migrations: {},
    latestVersion: 1,
  });
