import { Effect } from '@qpqjs/core';
import { EventDocEventPayload } from '@qpqjs/features';

import { SessionSeededParams } from '../../types/SessionSeededParams';
import { AdminSessionEffect } from './AdminSessionEffect';

export type AdminSessionStartedData = {
  username: string;
  seededParams: SessionSeededParams;
};

export type AdminSessionStartedEffect = Effect<AdminSessionEffect.SessionStarted, EventDocEventPayload<AdminSessionStartedData>>;
