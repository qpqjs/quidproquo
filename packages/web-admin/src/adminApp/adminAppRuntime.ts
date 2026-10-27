import { createQpqRuntimeDefinition } from 'quidproquo-web-react';

import { getApplySessionEventActionProcessor } from './actions/getApplySessionEventActionProcessor';
import { askAdminAppMain } from './logic/askAdminAppMain';
import { adminAppReducer } from './adminAppReducer';
import { createInitialAdminAppState } from './AdminAppState';
import { sharedAdminAppApi } from './sharedAdminAppApi';

export const adminAppRuntime = createQpqRuntimeDefinition({
  uniqueName: 'qpq/admin/adminApp',
  api: sharedAdminAppApi,
  initialState: createInitialAdminAppState(),
  reducer: adminAppReducer,
  // Boot story: session start is the first bind of the area (after login).
  onInit: askAdminAppMain,
  // On the definition so every binder (and the boot story, whichever
  // component's bind runs it) gets the ApplyEvent processor.
  getActionProcessors: getApplySessionEventActionProcessor,
});
