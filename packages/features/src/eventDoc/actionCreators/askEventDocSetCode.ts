import { AskResponse } from '@qpqjs/core';

import { askApplyEventDocEvent } from '../actions/askApplyEventDocEvent';
import { EventDocSetCodeEffect } from '../effects/EventDocSetCodeEffect';
import { EventDocEffect } from '../models';

/** Applies the reserved SetCode effect to the bound doc. */
export function* askEventDocSetCode(code: string): AskResponse<void> {
  yield* askApplyEventDocEvent<EventDocSetCodeEffect>(EventDocEffect.SetCode, { code });
}
