import { Effect } from '@qpqjs/core';
import { EventDocEventPayload } from '@qpqjs/features';

import { CorrelationOpenSource } from '../../types/CorrelationOpenSource';
import { AdminSessionEventType } from './AdminSessionEventType';

export type CorrelationOpenedData = {
  correlationId: string;
  source: CorrelationOpenSource;
};

export type CorrelationOpenedEvent = Effect<AdminSessionEventType.correlationOpened, EventDocEventPayload<CorrelationOpenedData>>;
