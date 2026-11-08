import { askConfigGetGlobal, AskResponse } from '@qpqjs/core';

import { askEventDocStoreReadOrThrow } from '../../eventDoc/context';
import { askEventDocAuthorise } from '../../eventDoc/logic/askEventDocAuthorise';
import { EventDocPermissionAction } from '../../eventDoc/types/EventDocPermissionAction';
import { EVENT_DOC_TRANSFER_AUTHORISER_GLOBAL } from '../constants/eventDocTransferGlobalNames';

/**
 * Runs the transfer's collection authoriser for `action` on the collection in context, the way that collection's
 * own routes would. A transfer declared without an authoriser is gated by scope alone. Requires the store context.
 */
export function* askEventDocTransferAuthorise(action: EventDocPermissionAction): AskResponse<void> {
  // buildEventDocTransferGlobals always sets the global ('' when no authoriser was declared), so the read is not
  // caught: a transfer route whose globals are missing fails closed rather than skipping the check.
  const authorise = yield* askConfigGetGlobal<string>(EVENT_DOC_TRANSFER_AUTHORISER_GLOBAL);
  if (!authorise) {
    return;
  }

  const { storeName } = yield* askEventDocStoreReadOrThrow();

  yield* askEventDocAuthorise({ authorise, storeName }, action);
}
