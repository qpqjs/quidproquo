import { Effect } from '@qpqjs/core';
import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSessionEffect } from './AdminSessionEffect';

export type AdminSessionTabChangedData = {
  tab: number;
  tabName: string;
};

export type AdminSessionTabChangedEffect = Effect<AdminSessionEffect.TabChanged, EventDocEventPayload<AdminSessionTabChangedData>>;
