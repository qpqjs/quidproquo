import { Effect } from 'quidproquo-core';
import { EventDocEventPayload } from 'quidproquo-features';

import { AdminSearchParams } from '../../types/AdminSearchParams';
import { SearchOrigin } from '../../types/SearchOrigin';
import { AdminSessionEventType } from './AdminSessionEventType';

export type SearchRequestedData = {
  search: AdminSearchParams;
  requestId: string;
  origin: SearchOrigin;
};

export type SearchRequestedEvent = Effect<AdminSessionEventType.searchRequested, EventDocEventPayload<SearchRequestedData>>;
