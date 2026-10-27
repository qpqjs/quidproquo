import { Effect } from 'quidproquo-core';
import { EventDocEvent } from 'quidproquo-features';

import { SessionLogEffect } from './SessionLogEffect';

export type SessionLogEventSavedPayload = {
  clientMessageId: string;
  storedEvent: EventDocEvent;
};

export type SessionLogEventSavedEffect = Effect<SessionLogEffect.eventSaved, SessionLogEventSavedPayload>;
