import { Effect } from '@qpqjs/core';
import { EventDocEvent } from '@qpqjs/features';

import { SessionLogEffect } from './SessionLogEffect';

export type SessionLogEventAppendedEffect = Effect<SessionLogEffect.eventAppended, EventDocEvent>;
