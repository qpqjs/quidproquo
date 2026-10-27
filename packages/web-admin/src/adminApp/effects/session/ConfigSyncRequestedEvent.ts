import { Effect } from '@qpqjs/core';
import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionEventType } from './AdminSessionEventType';

export type ConfigSyncRequestedData = Record<string, never>;

export type ConfigSyncRequestedEvent = Effect<AdminSessionEventType.configSyncRequested, EventDocEventPayload<ConfigSyncRequestedData>>;
