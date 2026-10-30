import { combineQpqReducers } from '@qpqjs/core';

import { liftQpqReducer } from './logic/liftQpqReducer';
import { AdminAppState } from './types/AdminAppState';
import { sessionLogReducer } from './sessionLogReducer';
import { volatileReducer } from './volatileReducer';

export const adminAppReducer = combineQpqReducers(
  liftQpqReducer<AdminAppState, 'sessionLog', Parameters<typeof sessionLogReducer>[1]>('sessionLog', sessionLogReducer),
  liftQpqReducer<AdminAppState, 'volatile', Parameters<typeof volatileReducer>[1]>('volatile', volatileReducer),
);
