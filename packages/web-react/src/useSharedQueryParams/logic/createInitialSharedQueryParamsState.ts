import { SharedQueryParamsState } from '../types/SharedQueryParamsState';

/** Empty: params arrive through askSyncParams on init and askSetParam afterwards. */
export const createInitialSharedQueryParamsState = (): SharedQueryParamsState => ({});
