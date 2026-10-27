import { askTenantSetBrand } from './actionCreators/askTenantSetBrand';

// The tenant document's write verbs, merged into the editor runtime as its
// documentApi. Name/code edits use the editor shell's built-in eventDoc verbs.
export const sharedTenantApi = {
  askTenantSetBrand,
};
