import { AdminAppState } from '../../AdminAppState';
import { selectSessionState } from './selectSessionState';

export const selectOpenCorrelation = (state: AdminAppState): string | null => selectSessionState(state).openCorrelation;
