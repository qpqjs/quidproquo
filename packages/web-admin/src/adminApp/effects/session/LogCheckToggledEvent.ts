import { Effect } from '@qpqjs/core';
import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionEventType } from './AdminSessionEventType';

export type LogCheckToggledData = {
  correlationId: string;
  checked: boolean;
};

export type LogCheckToggledEvent = Effect<AdminSessionEventType.logCheckToggled, EventDocEventPayload<LogCheckToggledData>>;
