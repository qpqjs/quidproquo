import { Effect } from 'quidproquo-core';
import { EventDocEventPayload } from 'quidproquo-features';

import { SessionSeededParams } from '../../types/SessionSeededParams';
import { AdminSessionEventType } from './AdminSessionEventType';

export type SessionStartedData = {
  username: string;
  seededParams: SessionSeededParams;
};

export type SessionStartedEvent = Effect<AdminSessionEventType.sessionStarted, EventDocEventPayload<SessionStartedData>>;
