import { createEventDocDefinition } from '../../eventDoc/definition/createEventDocDefinition';
import { TENANT_DOC_TYPE, TENANT_EVENTDOC_STORE } from '../constants/tenantStoreNames';
import { TenantEffect } from '../fold/effects/TenantEffect';
import { createInitialTenantDocumentState } from '../fold/logic/createInitialTenantDocumentState';
import { tenantDocumentFoldReducer } from '../fold/tenantDocumentFoldReducer';
import { askTenantSetBrand } from './actionCreators/askTenantSetBrand';
import { TENANT_VERSION } from './constants/tenantVersion';

// THE tenant registry event doc, with the collection's identity: the canonical
// definition the OWNER deploy registers as the collection's dynamic functions (see
// defineTenant), which is what lets the snapshot projector fold tenant snapshots like
// any other collection's. Same fold pieces a client-side workspace mounts; SET_BRAND
// coalesces (last write wins while pending) because askTenantSetBrand always carries
// the full brand payload. The generic identity/lifecycle verbs are merged in
// automatically.
export const tenantRegistryEventDoc = createEventDocDefinition({
  storeName: TENANT_EVENTDOC_STORE,
  type: TENANT_DOC_TYPE,
  schemaVersion: TENANT_VERSION,
  versions: [
    {
      version: 1,
      views: {
        document: {
          foldReducer: tenantDocumentFoldReducer,
          createInitialViewState: createInitialTenantDocumentState,
        },
      },
    },
  ],
  coalesceEventTypes: [TenantEffect.SetBrand],
  api: {
    askTenantSetBrand,
  },
});
