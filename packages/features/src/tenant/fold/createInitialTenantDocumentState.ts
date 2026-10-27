import { createEventDocInitialDocumentState } from '../../eventDoc/fold/createEventDocInitialDocumentState';
import { TenantDocument } from '../models/TenantDocument';

// The tenant document's version-1 initial state. No brandColors seed: an unbranded
// tenant folds to undefined and the site falls back to its default pair.
export const createInitialTenantDocumentState = (): TenantDocument => ({
  ...createEventDocInitialDocumentState(1),
});
