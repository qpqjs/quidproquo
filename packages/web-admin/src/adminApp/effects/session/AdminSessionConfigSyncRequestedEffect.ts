import { Effect } from '@qpqjs/core';
import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionEffect } from './AdminSessionEffect';

export type AdminSessionConfigSyncRequestedData = Record<string, never>;

export type AdminSessionConfigSyncRequestedEffect = Effect<
  AdminSessionEffect.ConfigSyncRequested,
  EventDocEventPayload<AdminSessionConfigSyncRequestedData>
>;
