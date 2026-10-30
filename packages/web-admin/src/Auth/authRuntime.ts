import { createQpqRuntimeDefinition } from '@qpqjs/web-react';

import { askAuthMain } from './logic/askAuthMain';
import { createInitialAuthState } from './logic/createInitialAuthState';
import { authReducer } from './authReducer';
import { frontendAuthApi } from './frontendAuthApi';

export const authRuntime = createQpqRuntimeDefinition({
  uniqueName: 'qpq/admin/auth',
  api: frontendAuthApi,
  initialState: createInitialAuthState(),
  reducer: authReducer,
  onInit: askAuthMain,
});
