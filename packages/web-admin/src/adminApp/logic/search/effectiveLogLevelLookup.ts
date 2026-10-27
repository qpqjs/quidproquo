import { AdminSearchParams } from '../../types/AdminSearchParams';

export const effectiveLogLevelLookup = (search: AdminSearchParams): string => search.logLevel || 'All';
