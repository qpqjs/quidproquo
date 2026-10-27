import { DynamicModuleLoader, Nullable, QPQError } from 'quidproquo-core';

import { StateMachineQPQConfigSetting } from '../../config/settings/stateMachine';
import { StateMachineStoryResolver } from './createStateMachineStoryResolver';

/**
 * Runs the side-effect story configured for each machine action that fired, in
 * firing order. Returns the first story error, or null when all succeed.
 */
export const runFiredActionStories = async (
  resolveStory: StateMachineStoryResolver,
  dynamicModuleLoader: DynamicModuleLoader,
  smConfig: StateMachineQPQConfigSetting,
  firedActions: string[],
  storyArgs: unknown[],
): Promise<Nullable<QPQError>> => {
  for (const actionName of firedActions) {
    const runtime = smConfig.actions[actionName];
    if (!runtime) {
      continue;
    }

    const storyModule = await dynamicModuleLoader(runtime);
    const storyResult = await resolveStory(storyModule, storyArgs);
    if (storyResult.error) {
      return storyResult.error;
    }
  }

  return null;
};
