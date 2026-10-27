import { Effect } from '@qpqjs/core';
import { EventDocEventPayload } from '@qpqjs/features';

import { SessionSeededParams } from '../../types/SessionSeededParams';
import { AdminSessionEventType } from './AdminSessionEventType';

export type SessionStartedData = {
  username: string;
  seededParams: SessionSeededParams;
};

export type SessionStartedEvent = Effect<AdminSessionEventType.sessionStarted, EventDocEventPayload<SessionStartedData>>;
