import { Effect } from 'quidproquo-core';
import { EventDocEventPayload } from 'quidproquo-features';

import { SessionEndReason } from '../../types/SessionEndReason';
import { AdminSessionEventType } from './AdminSessionEventType';

export type SessionEndedData = {
  reason: SessionEndReason;
};

export type SessionEndedEvent = Effect<AdminSessionEventType.sessionEnded, EventDocEventPayload<SessionEndedData>>;
