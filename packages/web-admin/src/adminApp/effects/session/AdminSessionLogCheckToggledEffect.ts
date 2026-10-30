import { Effect } from '@qpqjs/core';
import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionEffect } from './AdminSessionEffect';

export type AdminSessionLogCheckToggledData = {
  correlationId: string;
  checked: boolean;
};

export type AdminSessionLogCheckToggledEffect = Effect<AdminSessionEffect.LogCheckToggled, EventDocEventPayload<AdminSessionLogCheckToggledData>>;
