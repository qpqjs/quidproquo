import { AdminAppState } from '../../AdminAppState';
import { selectSessionState } from './selectSessionState';

export const selectTab = (state: AdminAppState): number => selectSessionState(state).tab;
