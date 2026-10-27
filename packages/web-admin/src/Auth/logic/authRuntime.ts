import { createQpqRuntimeDefinition } from 'quidproquo-web-react';

import { askAuthMain } from './runtime/askAuthMain';
import { authLogic } from './runtime/authLogic';
import { authInitalState, authReducer } from './authReducer';

export const authRuntime = createQpqRuntimeDefinition({
  uniqueName: 'qpq/admin/auth',
  api: authLogic,
  initialState: authInitalState,
  reducer: authReducer,
  onInit: askAuthMain,
});
