import { Effect } from '@qpqjs/core';
import { EventDocEvent } from '@qpqjs/features';

import { SessionLogEffect } from './SessionLogEffect';

export type SessionLogEventSavedPayload = {
  clientMessageId: string;
  storedEvent: EventDocEvent;
};

export type SessionLogEventSavedEffect = Effect<SessionLogEffect.eventSaved, SessionLogEventSavedPayload>;
