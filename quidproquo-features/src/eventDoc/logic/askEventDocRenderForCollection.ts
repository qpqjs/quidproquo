import { AskResponse, createDynamicFunctionCaller } from 'quidproquo-core';

import { eventDocFunctionsName } from '../constants/eventDocFunctionsName';
import { askEventDocProvideStore } from '../context/askEventDocProvideStore';
import { EventDocInvokableFunctions } from '../definition/types/EventDocInvokableFunctions';
import { EventDocRenderInput, EventDocRenderResult } from '../models';

/**
 * Render a doc of another collection in-process under that collection's store context. A missing registration
 * or render member propagates as its dynamic-functions error.
 */
export function* askEventDocRenderForCollection(storeName: string, type: string, input: EventDocRenderInput): AskResponse<EventDocRenderResult> {
  const functionsCaller = createDynamicFunctionCaller<EventDocInvokableFunctions>(eventDocFunctionsName(storeName, type));

  return yield* askEventDocProvideStore({ storeName, type }, functionsCaller.render(input));
}
