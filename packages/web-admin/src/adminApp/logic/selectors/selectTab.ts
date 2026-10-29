import { AdminAppState } from '../../types/AdminAppState';
import { selectSessionState } from './selectSessionState';

export const selectTab = (state: AdminAppState): number => selectSessionState(state).tab;
