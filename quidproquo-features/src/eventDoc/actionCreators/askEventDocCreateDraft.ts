import { AskResponse } from 'quidproquo-core';

import { askApplyEventDocEvent } from '../actions/eventDocEvent/askApplyEventDocEvent';
import { EventDocCreateDraftEffect } from '../effects/EventDocCreateDraftEffect';
import { EventDocEffect } from '../models';

/** Applies the reserved CreateDraft effect to the bound doc. */
export function* askEventDocCreateDraft(): AskResponse<void> {
  yield* askApplyEventDocEvent<EventDocCreateDraftEffect>(EventDocEffect.CreateDraft, undefined);
}
