import { Nullable } from '@qpqjs/core';

import { AdminAppState } from '../../AdminAppState';
import { selectSessionState } from './selectSessionState';

export const selectOpenCorrelation = (state: AdminAppState): Nullable<string> => selectSessionState(state).openCorrelation;
