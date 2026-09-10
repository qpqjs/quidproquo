import { EventDocAssetRef } from '../../eventDoc/models';
import { TenantBrandColors } from './TenantBrandColors';

// SET_BRAND payload: partial branding update folded onto the tenant document.
// brandColors is a whole-or-nothing pair (both primary and secondary), replaced
// as a unit when present. logo is an uploaded asset ref (like every other
// editor's blobs) - resolved to a URL at read time, never stored as a URL.
// displayName is the text shown beside the logo in the app header: absent =
// leave unchanged, '' = clear it (a logo-only header).
export type TenantSetBrandData = {
  brandColors?: TenantBrandColors;
  logo?: EventDocAssetRef;
  displayName?: string;
};
