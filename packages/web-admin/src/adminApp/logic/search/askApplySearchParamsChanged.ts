import { AskResponse } from '@qpqjs/core';

import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminSessionEffect } from '../../effects/session/AdminSessionEffect';
import { AdminSessionSearchParamsChangedData } from '../../effects/session/AdminSessionSearchParamsChangedEffect';
import { AdminSearchParams } from '../../types/AdminSearchParams';
import { askProjectSessionToUrl } from '../url/askProjectSessionToUrl';

// Full-snapshot event (coalesced while pending) so rapid typing folds to one
// audit entry with the final values.
export function* askApplySearchParamsChanged(search: AdminSearchParams): AskResponse<void> {
  yield* askApplySessionEvent<AdminSessionSearchParamsChangedData>(AdminSessionEffect.SearchParamsChanged, { search });

  yield* askProjectSessionToUrl();
}
