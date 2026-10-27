import { AskResponse } from 'quidproquo-core';

import { askApplySessionEvent } from '../../actions/askApplySessionEvent';
import { AdminSessionEventType } from '../../effects/session/AdminSessionEventType';
import { SearchParamsChangedData } from '../../effects/session/SearchParamsChangedEvent';
import { AdminSearchParams } from '../../types/AdminSearchParams';
import { askProjectSessionToUrl } from '../url/askProjectSessionToUrl';

// Full-snapshot event (coalesced while pending) so rapid typing folds to one
// audit entry with the final values.
export function* askApplySearchParamsChanged(search: AdminSearchParams): AskResponse<void> {
  yield* askApplySessionEvent<SearchParamsChangedData>(AdminSessionEventType.searchParamsChanged, { search });

  yield* askProjectSessionToUrl();
}
