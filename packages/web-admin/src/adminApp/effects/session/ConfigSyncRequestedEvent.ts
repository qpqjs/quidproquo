import { Effect } from 'quidproquo-core';
import { EventDocEventPayload } from 'quidproquo-features';

import { AdminSessionEventType } from './AdminSessionEventType';

export type ConfigSyncRequestedData = Record<string, never>;

export type ConfigSyncRequestedEvent = Effect<AdminSessionEventType.configSyncRequested, EventDocEventPayload<ConfigSyncRequestedData>>;
