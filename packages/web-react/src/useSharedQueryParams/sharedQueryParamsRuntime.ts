import { createQpqRuntimeDefinition } from '../runtime/createQpqRuntimeDefinition';
import { sharedQueryParamsLogic } from './logic/runtime';
import { sharedQueryParamsInitialState, sharedQueryParamsReducer } from './logic';

export const sharedQueryParamsRuntime = createQpqRuntimeDefinition({
  uniqueName: 'qpq/web-react/sharedQueryParams',
  api: sharedQueryParamsLogic,
  initialState: sharedQueryParamsInitialState,
  reducer: sharedQueryParamsReducer,
});
