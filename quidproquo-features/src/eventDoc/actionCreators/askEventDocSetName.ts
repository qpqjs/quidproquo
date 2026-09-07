import { AskResponse } from 'quidproquo-core';

import { askApplyEventDocEvent } from '../actions/eventDocEvent/askApplyEventDocEvent';
import { EventDocSetNameEffect } from '../effects/EventDocSetNameEffect';
import { EventDocEffect } from '../models';

/** Applies the reserved SetName effect to the bound doc. */
export function* askEventDocSetName(name: string): AskResponse<void> {
  yield* askApplyEventDocEvent<EventDocSetNameEffect>(EventDocEffect.SetName, { name });
}
