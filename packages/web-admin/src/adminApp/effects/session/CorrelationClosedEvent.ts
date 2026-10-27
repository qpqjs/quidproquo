import { Effect } from '@qpqjs/core';
import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionEventType } from './AdminSessionEventType';

export type CorrelationClosedData = {
  correlationId: string;
};

export type CorrelationClosedEvent = Effect<AdminSessionEventType.correlationClosed, EventDocEventPayload<CorrelationClosedData>>;
