import { Effect } from '@qpqjs/core';
import { EventDocEventPayload } from '@qpqjs/features';

import { AdminSearchParams } from '../../types/AdminSearchParams';
import { AdminSessionEffect } from './AdminSessionEffect';

export type AdminSessionSearchParamsChangedData = {
  search: AdminSearchParams;
};

export type AdminSessionSearchParamsChangedEffect = Effect<
  AdminSessionEffect.SearchParamsChanged,
  EventDocEventPayload<AdminSessionSearchParamsChangedData>
>;
