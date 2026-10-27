import { createQpqRuntimeDefinition } from '../runtime/createQpqRuntimeDefinition';
import { sharedQueryParamsLogic } from './logic/runtime';
import { sharedQueryParamsInitalState, sharedQueryParamsReducer } from './logic';

export const sharedQueryParamsRuntime = createQpqRuntimeDefinition({
  uniqueName: 'qpq/web-react/sharedQueryParams',
  api: sharedQueryParamsLogic,
  initialState: sharedQueryParamsInitalState,
  reducer: sharedQueryParamsReducer,
});
