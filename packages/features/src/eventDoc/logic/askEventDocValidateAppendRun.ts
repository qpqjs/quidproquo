import { AskResponse } from 'quidproquo-core';

import { EventDocEvent } from '../models';
import { askEventDocValidateAppend } from './askEventDocValidateAppend';

/**
 * Validate a run of consecutive events, each against the state its predecessors fold to. The first rejection
 * throws Invalid.
 */
export function* askEventDocValidateAppendRun<S = unknown>(events: EventDocEvent[], state: S): AskResponse<void> {
  let current = state;

  for (const event of events) {
    current = yield* askEventDocValidateAppend(event, current);
  }
}
