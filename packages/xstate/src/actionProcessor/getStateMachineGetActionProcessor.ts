import { actionResult, actionResultError, createActionProcessor, ErrorTypeEnum, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { askStateMachineGetBase, StateMachineActionType } from '../actions';
import { getStateMachineByName } from '../config';
import { StateMachineEntity } from '../models/StateMachineEntity';
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
    if (!entityResult.success) {
      return actionResultError(entityResult.error.errorType, entityResult.error.errorText);
    }

    return actionResult(entityResult.result);
  };
};

export const getStateMachineGetActionProcessor = createActionProcessor(askStateMachineGetBase, getProcessStateMachineGet);
