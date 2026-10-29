import { createQpqRuntimeDefinition } from '@qpqjs/web-react';

import { askAuthMain } from './runtime/askAuthMain';
import { authLogic } from './runtime/authLogic';
import { authInitialState, authReducer } from './authReducer';

export const authRuntime = createQpqRuntimeDefinition({
  uniqueName: 'qpq/admin/auth',
  api: authLogic,
  initialState: authInitialState,
  reducer: authReducer,
  onInit: askAuthMain,
});
