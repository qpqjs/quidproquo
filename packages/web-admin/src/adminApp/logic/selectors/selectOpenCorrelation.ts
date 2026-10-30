import { Nullable } from '@qpqjs/core';

import { AdminAppState } from '../../types/AdminAppState';
import { selectSessionState } from './selectSessionState';

export const selectOpenCorrelation = (state: AdminAppState): Nullable<string> => selectSessionState(state).openCorrelation;
