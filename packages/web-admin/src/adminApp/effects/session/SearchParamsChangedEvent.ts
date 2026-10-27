import { Effect } from 'quidproquo-core';
import { EventDocEventPayload } from 'quidproquo-features';

import { AdminSearchParams } from '../../types/AdminSearchParams';
import { AdminSessionEventType } from './AdminSessionEventType';

export type SearchParamsChangedData = {
  search: AdminSearchParams;
};

export type SearchParamsChangedEvent = Effect<AdminSessionEventType.searchParamsChanged, EventDocEventPayload<SearchParamsChangedData>>;
