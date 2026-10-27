import { buildEffectReducer } from 'quidproquo-core';

import { VolatileEffect } from './effects/volatile/VolatileEffect';
import { VolatileEffects } from './effects/volatile/VolatileEffects';
import { logLogSearchCompleted } from './stateUpdaters/volatile/logLogSearchCompleted';
import { logLogSearchPartLoaded } from './stateUpdaters/volatile/logLogSearchPartLoaded';
import { logLogSearchStarted } from './stateUpdaters/volatile/logLogSearchStarted';
import { logSearchCompleted } from './stateUpdaters/volatile/logSearchCompleted';
import { logSearchPartLoaded } from './stateUpdaters/volatile/logSearchPartLoaded';
import { logSearchStarted } from './stateUpdaters/volatile/logSearchStarted';
import { realtimeErrorLogReceived } from './stateUpdaters/volatile/realtimeErrorLogReceived';
import { serviceNamesLoaded } from './stateUpdaters/volatile/serviceNamesLoaded';
import { VolatileState } from './VolatileState';

export const volatileReducer = buildEffectReducer<VolatileState, VolatileEffects>({
  [VolatileEffect.logSearchStarted]: logSearchStarted,
  [VolatileEffect.logSearchPartLoaded]: logSearchPartLoaded,
  [VolatileEffect.logSearchCompleted]: logSearchCompleted,
  [VolatileEffect.logLogSearchStarted]: logLogSearchStarted,
  [VolatileEffect.logLogSearchPartLoaded]: logLogSearchPartLoaded,
  [VolatileEffect.logLogSearchCompleted]: logLogSearchCompleted,
  [VolatileEffect.serviceNamesLoaded]: serviceNamesLoaded,
  [VolatileEffect.realtimeErrorLogReceived]: realtimeErrorLogReceived,
});
