import { AskResponse } from 'quidproquo-core';

import { EventDocWorkspaceSlotBinding } from '../types/EventDocWorkspaceSlotBinding';
import { EventDocWorkspaceStoryApi } from '../types/EventDocWorkspaceStoryApi';
import { askRunInEventDocWorkspaceSlot } from './askRunInEventDocWorkspaceSlot';

const bindVerb = (binding: EventDocWorkspaceSlotBinding, verb: (...args: any[]) => AskResponse<any>) =>
  function* boundVerb(...args: any[]): AskResponse<any> {
    return yield* askRunInEventDocWorkspaceSlot(binding, verb(...args));
  };

/** Returns a signature-identical api whose verbs all run under the slot's binding, so one domain api can mount at many slot keys. */
export const bindEventDocWorkspaceApi = <TApi extends EventDocWorkspaceStoryApi>(binding: EventDocWorkspaceSlotBinding, api: TApi): TApi =>
  Object.fromEntries(Object.entries(api).map(([verbName, verb]) => [verbName, bindVerb(binding, verb)])) as TApi;
