import { buildEffectReducer } from 'quidproquo-core';

import { SessionLogEffect } from './effects/sessionLog/SessionLogEffect';
import { SessionLogEffects } from './effects/sessionLog/SessionLogEffects';
import { docCreated } from './stateUpdaters/sessionLog/docCreated';
import { eventAppended } from './stateUpdaters/sessionLog/eventAppended';
import { eventSaved } from './stateUpdaters/sessionLog/eventSaved';
import { flushFailed } from './stateUpdaters/sessionLog/flushFailed';
import { flushStarted } from './stateUpdaters/sessionLog/flushStarted';
import { SessionLogState } from './SessionLogState';

export const sessionLogReducer = buildEffectReducer<SessionLogState, SessionLogEffects>({
  [SessionLogEffect.docCreated]: docCreated,
  [SessionLogEffect.eventAppended]: eventAppended,
  [SessionLogEffect.flushStarted]: flushStarted,
  [SessionLogEffect.eventSaved]: eventSaved,
  [SessionLogEffect.flushFailed]: flushFailed,
});
