import { EventDocEventPayload } from '../../../eventDoc/models';
import { TenantDocument } from '../../models/TenantDocument';
import { TenantSetBrandData } from '../../models/TenantSetBrandData';

// Partial branding merge: only the fields present on the event change.
export const setBrand = (state: TenantDocument, payload: EventDocEventPayload<TenantSetBrandData>): TenantDocument => ({
  ...state,
  brandColors: payload.data.brandColors ?? state.brandColors,
  logo: payload.data.logo ?? state.logo,
  displayName: payload.data.displayName ?? state.displayName,
});
