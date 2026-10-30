import { AdminAppState } from '../../types/AdminAppState';
import { AdminSearchParams } from '../../types/AdminSearchParams';
import { selectSessionState } from './selectSessionState';

export const selectSearchParams = (state: AdminAppState): AdminSearchParams => selectSessionState(state).search;
