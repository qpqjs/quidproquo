import { QpqReducer } from '@qpqjs/core';

import { buildEventDocFoldReducer } from '../../eventDoc/fold/buildEventDocFoldReducer';
import { EventDocFoldEffects } from '../../eventDoc/fold/EventDocFoldEffects';
import { EventDocEvent } from '../../eventDoc/models';
import { TenantDocument } from '../models/TenantDocument';
import { TenantEffect } from './effects/TenantEffect';
import { TenantEffects } from './effects/TenantEffects';
import { createInitialTenantDocumentState } from './logic/createInitialTenantDocumentState';
import { setBrand } from './stateUpdaters/setBrand';

// The tenant document's assembled fold reducer: identity/lifecycle from the reserved
// base effects, branding from SET_BRAND. Typed to EventDocEvent at this registration
// boundary (the same convention as every fold reducer registration) so consumers can
// hand it straight to foldEventDocLog or a workspace document slot.
export const tenantDocumentFoldReducer = buildEventDocFoldReducer<TenantDocument, EventDocFoldEffects<TenantEffects>>(
  createInitialTenantDocumentState,
  {
    [TenantEffect.SetBrand]: setBrand,
  },
) as QpqReducer<TenantDocument, EventDocEvent>;
