import { ActionProcessorResult, actionResultError, DynamicModuleLoader, ErrorTypeEnum, Nullable, storyResultToActionResult } from '@qpqjs/core';

import { StateMachineQPQConfigSetting } from '../../config/settings/stateMachine';
import { StateMachineStoryResolver } from './createStateMachineStoryResolver';

/**
 * Runs the side-effect story configured for each machine action that fired, in
 * firing order. Returns the first failure as an errored action result (label and stack
 * kept), or null when all succeed.
 */
export const runFiredActionStories = async (
  resolveStory: StateMachineStoryResolver,
  dynamicModuleLoader: DynamicModuleLoader,
  smConfig: StateMachineQPQConfigSetting,
  firedActions: string[],
  storyArgs: unknown[],
): Promise<Nullable<ActionProcessorResult<never>>> => {
  for (const actionName of firedActions) {
    const runtime = smConfig.actions[actionName];
    if (!runtime) {
      continue;
    }

    const storyModule = await dynamicModuleLoader(runtime);
    if (!storyModule) {
      return actionResultError(ErrorTypeEnum.NotFound, `Action story [${actionName}] could not be loaded`);
    }

    const storyResult = await resolveStory(storyModule, storyArgs);
    if (storyResult.error) {
      return storyResultToActionResult(storyResult, `StateMachine action ${actionName}`);
    }
  }

  return null;
};
