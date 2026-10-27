import { Effect } from '@qpqjs/core';
import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSearchParams } from '../../types/AdminSearchParams';
import { AdminSessionEventType } from './AdminSessionEventType';

export type SearchParamsChangedData = {
  search: AdminSearchParams;
};

export type SearchParamsChangedEvent = Effect<AdminSessionEventType.searchParamsChanged, EventDocEventPayload<SearchParamsChangedData>>;
