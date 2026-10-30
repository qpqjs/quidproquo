import { ActionProcessorResult, actionResult, actionResultError, askKeyValueStoreGet, ErrorTypeEnum, storyResultToActionResult } from '@qpqjs/core';

import { StateMachineQPQConfigSetting } from '../../config/settings/stateMachine';
import { StateMachineEntity } from '../../models/StateMachineEntity';
import { StateMachineStoryResolver } from './createStateMachineStoryResolver';

/** Loads the entity backing a state machine instance from its key value store, mapping a missing entity to NotFound. */
export const loadStateMachineEntity = async (
  resolveStory: StateMachineStoryResolver,
  smConfig: StateMachineQPQConfigSetting,
  id: string,
): Promise<ActionProcessorResult<StateMachineEntity>> => {
  const getResult = await resolveStory(function* askGetEntity() {
    return yield* askKeyValueStoreGet<StateMachineEntity>(smConfig.keyValueStoreName, id);
  }, []);

  if (getResult.error) {
    return storyResultToActionResult(getResult, 'StateMachine load entity');
  }

  const entity = getResult.result;
  if (!entity) {
    return actionResultError(ErrorTypeEnum.NotFound, `Entity not found: ${id}`);
  }

  return actionResult(entity);
};
