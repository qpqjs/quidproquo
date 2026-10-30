import { Effect } from '@qpqjs/core';
import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionEffect } from './AdminSessionEffect';

export type AdminSessionConfigServiceSelectedData = {
  service: string;
};

export type AdminSessionConfigServiceSelectedEffect = Effect<
  AdminSessionEffect.ConfigServiceSelected,
  EventDocEventPayload<AdminSessionConfigServiceSelectedData>
>;
