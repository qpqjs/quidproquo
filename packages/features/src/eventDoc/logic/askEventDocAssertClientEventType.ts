import { askCatch, AskResponse, askThrowError, createDynamicFunctionCaller, ErrorTypeEnum } from '@qpqjs/core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocResolveStore } from '../context/askEventDocResolveStore';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { eventDocServerEventTypeRefusal } from '../validation/eventDocServerEventTypeRefusal';
import { isEventDocFunctionsMissing } from './isEventDocFunctionsMissing';

/**
 * The client trust boundary for event types: throws Forbidden when the collection declares `type` server-only.
 * A collection with no registered definition, or one registered without the member, declares none. Requires the
 * store context.
 */
export function* askEventDocAssertClientEventType(type: string): AskResponse<void> {
  const { storeName, type: docType } = yield* askEventDocResolveStore();
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(eventDocFunctionsName(storeName, docType));

  const serverEventTypes = yield* askCatch(functionsCaller.getServerEventTypes());

  if (!serverEventTypes.success) {
    if (isEventDocFunctionsMissing(serverEventTypes.error.errorType)) {
      return;
    }

    return yield* askThrowError(serverEventTypes.error.errorType, serverEventTypes.error.errorText);
  }

  if (serverEventTypes.result.includes(type)) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, eventDocServerEventTypeRefusal(type));
  }
}
