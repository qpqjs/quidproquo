import { Effect } from 'quidproquo-core';
import { EventDocEvent } from 'quidproquo-features';

import { SessionLogEffect } from './SessionLogEffect';

export type SessionLogDocCreatedPayload = {
  docId: string;
  events: EventDocEvent[];
};

export type SessionLogDocCreatedEffect = Effect<SessionLogEffect.docCreated, SessionLogDocCreatedPayload>;
