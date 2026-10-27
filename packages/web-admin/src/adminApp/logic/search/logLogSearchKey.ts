import { AdminSearchParams } from '../../types/AdminSearchParams';
import { effectiveLogLevelLookup } from './effectiveLogLevelLookup';

// Cache key for the volatile log-log results store — raw params, like logSearchKey.
export const logLogSearchKey = (search: AdminSearchParams): string =>
  [effectiveLogLevelLookup(search), search.startIsoDateTime, search.endIsoDateTime, search.service, search.msg].join('|');
