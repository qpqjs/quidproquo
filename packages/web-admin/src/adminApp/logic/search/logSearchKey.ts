import { AdminSearchParams } from '../../types/AdminSearchParams';
import { effectiveRuntimeType } from './effectiveRuntimeType';

// Cache key for the volatile log-results store — built from the RAW session
// search params (the same values both the UI and the fetch story see), so a
// screen always finds the results its current params produced.
export const logSearchKey = (search: AdminSearchParams): string =>
  [
    effectiveRuntimeType(search),
    search.startIsoDateTime,
    search.endIsoDateTime,
    search.service,
    search.user,
    search.info,
    search.error,
    search.deep,
  ].join('|');
