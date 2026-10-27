import { QpqReducer } from 'quidproquo-core';

import { buildEventDocFoldReducer } from '../../eventDoc/fold/buildEventDocFoldReducer';
import { EventDocEvent } from '../../eventDoc/models';
import { TenantDocument } from '../models/TenantDocument';
import { setBrand } from './stateUpdaters/setBrand';
import { createInitialTenantDocumentState } from './createInitialTenantDocumentState';
import { TenantEffect, TenantEffects } from './TenantEffect';

// The tenant document's assembled fold reducer: identity/lifecycle from the reserved
// base effects, branding from SET_BRAND. Typed to EventDocEvent at this registration
// boundary (the same convention as every fold reducer registration) so consumers can
// hand it straight to foldEventDocLog or a workspace document slot.
export const tenantDocumentFoldReducer = buildEventDocFoldReducer<TenantDocument, TenantEffects>(createInitialTenantDocumentState, {
  [TenantEffect.setBrand]: setBrand,
}) as QpqReducer<TenantDocument, EventDocEvent>;
