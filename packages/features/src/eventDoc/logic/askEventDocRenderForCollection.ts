import { AskResponse, createDynamicFunctionCaller } from '@qpqjs/core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocStoreProvide, buildEventDocStore } from '../context';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { EventDocRenderInput, EventDocRenderResult } from '../models';

/**
 * Render a doc of another collection in-process under that collection's store context. A missing registration
 * or render member propagates as its dynamic-functions error.
 */
export function* askEventDocRenderForCollection(storeName: string, type: string, input: EventDocRenderInput): AskResponse<EventDocRenderResult> {
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(eventDocFunctionsName(storeName, type));

  return yield* askEventDocStoreProvide(buildEventDocStore({ storeName, type }), functionsCaller.render(input));
}
