import { AskResponse } from 'quidproquo-core';

import { askApplyEventDocEvent } from '../../../eventDoc';
import { TenantEffect } from '../../fold';
import { TenantSetBrandData } from '../../models';

// Append a SET_BRAND event — the editor stamps the schema version + provenance.
//
// Callers must ALWAYS pass the FULL brand payload ({ brandColors, logo, displayName }),
// never a partial: SET_BRAND is coalesced while pending (last write wins) but
// the fold merges partially, so a partial coalesced event would silently drop
// earlier unsaved edits.
export function* askTenantSetBrand(data: TenantSetBrandData): AskResponse<void> {
  yield* askApplyEventDocEvent(TenantEffect.setBrand, data satisfies TenantSetBrandData);
}
