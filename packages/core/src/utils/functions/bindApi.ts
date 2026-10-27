import { AskResponse, BoundLogicStory } from '../../types';
import { bindApiFunction } from './bindApiFunction';

export function bindApi<ApiDeps, ApiFunctions extends Record<string, (deps: ApiDeps, ...args: any) => AskResponse<any>>>(
  dependencies: ApiDeps,
  apiFunctions: ApiFunctions,
): { [K in keyof ApiFunctions]: BoundLogicStory<ApiFunctions[K]> } {
  type BoundFunctions = {
    [K in keyof ApiFunctions]: BoundLogicStory<ApiFunctions[K]>;
  };

  const boundFunctions = Object.keys(apiFunctions).reduce((acc, key) => {
    const func = apiFunctions[key];
    acc[key as keyof ApiFunctions] = bindApiFunction(dependencies, func) as BoundFunctions[keyof ApiFunctions];
    return acc;
  }, {} as BoundFunctions);

  return boundFunctions;
}
