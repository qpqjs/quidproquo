import { SharedQueryParamsSetParamPayload } from '../effects/SharedQueryParamsSetParamEffect';
import { SharedQueryParamsState } from '../types/SharedQueryParamsState';

export const setParam = (state: SharedQueryParamsState, { key, values }: SharedQueryParamsSetParamPayload): SharedQueryParamsState => ({
  ...state,
  [key]: values,
});
