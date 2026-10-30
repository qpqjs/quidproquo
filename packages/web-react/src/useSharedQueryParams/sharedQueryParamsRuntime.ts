import { createQpqRuntimeDefinition } from '../runtime/createQpqRuntimeDefinition';
import { createInitialSharedQueryParamsState } from './logic/createInitialSharedQueryParamsState';
import { frontendSharedQueryParamsApi } from './frontendSharedQueryParamsApi';
import { sharedQueryParamsReducer } from './sharedQueryParamsReducer';

export const sharedQueryParamsRuntime = createQpqRuntimeDefinition({
  uniqueName: 'qpq/web-react/sharedQueryParams',
  api: frontendSharedQueryParamsApi,
  initialState: createInitialSharedQueryParamsState(),
  reducer: sharedQueryParamsReducer,
});
