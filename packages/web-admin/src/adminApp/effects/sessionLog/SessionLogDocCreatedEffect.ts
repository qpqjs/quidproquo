import { Effect } from '@qpqjs/core';
import { EventDocEvent } from '@qpqjs/features';

import { SessionLogEffect } from './SessionLogEffect';

export type SessionLogDocCreatedPayload = {
  docId: string;
  events: EventDocEvent[];
};

export type SessionLogDocCreatedEffect = Effect<SessionLogEffect.docCreated, SessionLogDocCreatedPayload>;
