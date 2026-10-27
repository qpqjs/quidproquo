import { Effect } from 'quidproquo-core';

import { SessionLogEffect } from './SessionLogEffect';

export type SessionLogFlushStartedEffect = Effect<SessionLogEffect.flushStarted>;
