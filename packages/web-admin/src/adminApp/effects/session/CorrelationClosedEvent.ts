import { Effect } from 'quidproquo-core';
import { EventDocEventPayload } from 'quidproquo-features';

import { AdminSessionEventType } from './AdminSessionEventType';

export type CorrelationClosedData = {
  correlationId: string;
};

export type CorrelationClosedEvent = Effect<AdminSessionEventType.correlationClosed, EventDocEventPayload<CorrelationClosedData>>;
