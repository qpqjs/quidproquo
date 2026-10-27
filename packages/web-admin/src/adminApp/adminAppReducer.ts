import { combineQpqReducers } from 'quidproquo-core';

import { liftQpqReducer } from './logic/liftQpqReducer';
import { AdminAppState } from './AdminAppState';
import { sessionLogReducer } from './sessionLogReducer';
import { volatileReducer } from './volatileReducer';

export const adminAppReducer = combineQpqReducers(
  liftQpqReducer<AdminAppState, 'sessionLog', Parameters<typeof sessionLogReducer>[1]>('sessionLog', sessionLogReducer),
  liftQpqReducer<AdminAppState, 'volatile', Parameters<typeof volatileReducer>[1]>('volatile', volatileReducer),
);
