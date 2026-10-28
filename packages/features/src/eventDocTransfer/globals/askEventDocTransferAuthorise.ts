import { askCatch, askConfigGetGlobal, askInlineFunctionExecute, AskResponse } from '@qpqjs/core';

import { askEventDocResolveStore } from '../../eventDoc/context';
import { EventDocAuthoriseInput } from '../../eventDoc/types/EventDocAuthoriseInput';
import { EventDocPermissionAction } from '../../eventDoc/types/EventDocPermissionAction';
import { EVENT_DOC_TRANSFER_AUTHORISER_GLOBAL } from '../constants';

/**
 * Runs the transfer's collection authoriser for `action` on the collection in context, the way that collection's
 * own routes would. A transfer declared without an authoriser is gated by scope alone. Requires the store context.
 */
export function* askEventDocTransferAuthorise(action: EventDocPermissionAction): AskResponse<void> {
  // Routes registered before the global existed have none at all.
  const authorise = yield* askCatch(askConfigGetGlobal<string>(EVENT_DOC_TRANSFER_AUTHORISER_GLOBAL));
  if (!authorise.success || !authorise.result) {
    return;
  }

  const { storeName } = yield* askEventDocResolveStore();

  yield* askInlineFunctionExecute<void, EventDocAuthoriseInput>(authorise.result, { storeName, action });
}
