import { EventDocAssetRef, EventDocDocument } from '../../eventDoc/models';
import { TenantBrandColors } from './TenantBrandColors';

// The folded tenant document: universal eventDoc fields plus the branding slice.
// Branding is optional — a tenant that never set it folds to no brandColors/logo,
// and the site falls back to its default pair. displayName is the header text shown
// beside the logo; blank/absent means the header shows the tenant name only when
// there is no logo to stand in for it.
export type TenantDocument = EventDocDocument & {
  brandColors?: TenantBrandColors;
  logo?: EventDocAssetRef;
  displayName?: string;
};
