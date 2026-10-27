import { Effect } from 'quidproquo-core';
import { EventDocEvent } from 'quidproquo-features';

import { SessionLogEffect } from './SessionLogEffect';

export type SessionLogEventAppendedEffect = Effect<SessionLogEffect.eventAppended, EventDocEvent>;
