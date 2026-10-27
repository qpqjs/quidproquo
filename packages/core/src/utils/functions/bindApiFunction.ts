import { AskResponse, BoundLogicStory, UnboundLogicStory } from '../../types';

export function bindApiFunction<ApiDeps, Args extends any[], R>(
  dependencies: ApiDeps,
  askFunction: UnboundLogicStory<ApiDeps, Args, R>,
): BoundLogicStory<UnboundLogicStory<ApiDeps, Args, R>> {
  return function (...args: Args): AskResponse<R> {
    return askFunction(dependencies, ...args);
  };
}
