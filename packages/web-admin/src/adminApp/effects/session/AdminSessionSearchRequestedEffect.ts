import { Effect } from '@qpqjs/core';
import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSearchParams } from '../../types/AdminSearchParams';
import { SearchOrigin } from '../../types/SearchOrigin';
import { AdminSessionEffect } from './AdminSessionEffect';

export type AdminSessionSearchRequestedData = {
  search: AdminSearchParams;
  requestId: string;
  origin: SearchOrigin;
};

export type AdminSessionSearchRequestedEffect = Effect<AdminSessionEffect.SearchRequested, EventDocEventPayload<AdminSessionSearchRequestedData>>;
