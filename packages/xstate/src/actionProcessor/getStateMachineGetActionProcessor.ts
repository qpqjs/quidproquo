import {
  actionResultError,
  createActionProcessor,
  ErrorTypeEnum,
  isErroredActionResult,
  ProcessorFor,
  QPQConfig,
  resolveActionResult,
} from '@qpqjs/core';

import { askStateMachineGetBase } from '../actions';
import { getStateMachineByName } from '../config';
import { createStateMachineStoryResolver } from './utils/createStateMachineStoryResolver';
import { loadStateMachineEntity } from './utils/loadStateMachineEntity';

const getProcessStateMachineGet = (qpqConfig: QPQConfig): ProcessorFor<typeof askStateMachineGetBase> => {
  return async (payload, session, actionProcessors, logger, updateSession, dynamicModuleLoader, streamRegistry) => {
    const smConfig = getStateMachineByName(qpqConfig, payload.stateMachineName);
    if (!smConfig) {
      return actionResultError(ErrorTypeEnum.NotFound, `State machine not found: ${payload.stateMachineName}`);
    }

    const resolveStory = createStateMachineStoryResolver(
      'StateMachine Get',
      qpqConfig,
      session,
      actionProcessors,
      logger,
      dynamicModuleLoader,
      streamRegistry,
    );

    const entityResult = await loadStateMachineEntity(resolveStory, smConfig, payload.id);
    if (isErroredActionResult(entityResult)) {
      return entityResult;
    }

    return entityResult;
  };
};

export const getStateMachineGetActionProcessor = createActionProcessor(askStateMachineGetBase, getProcessStateMachineGet);
