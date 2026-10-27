import {
  askKeyValueStoreGet,
  EitherActionResult,
  ErrorTypeEnum,
  getSuccessfulEitherActionResult,
  getUnsuccessfulEitherActionResult,
} from 'quidproquo-core';

import { StateMachineQPQConfigSetting } from '../../config/settings/stateMachine';
import { StateMachineEntity } from '../../models/StateMachineEntity';
import { StateMachineStoryResolver } from './createStateMachineStoryResolver';

/** Loads the entity backing a state machine instance from its key value store, mapping a missing entity to NotFound. */
export const loadStateMachineEntity = async (
  resolveStory: StateMachineStoryResolver,
  smConfig: StateMachineQPQConfigSetting,
  id: string,
): Promise<EitherActionResult<StateMachineEntity>> => {
  const getResult = await resolveStory(function* askGetEntity() {
    return yield* askKeyValueStoreGet<StateMachineEntity>(smConfig.keyValueStoreName, id);
  }, []);

  if (getResult.error) {
    return getUnsuccessfulEitherActionResult(getResult.error);
  }

  const entity = getResult.result;
  if (!entity) {
    return getUnsuccessfulEitherActionResult({
      errorType: ErrorTypeEnum.NotFound,
      errorText: `Entity not found: ${id}`,
    });
  }

  return getSuccessfulEitherActionResult(entity);
};
