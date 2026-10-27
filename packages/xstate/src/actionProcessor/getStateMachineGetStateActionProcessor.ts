import { actionResult, actionResultError, createActionProcessor, ErrorTypeEnum, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { createActor, createMachine, Snapshot } from 'xstate';

import { askStateMachineGetState, StateMachineActionType } from '../actions';
import { getStateMachineByName } from '../config';
import { createStateMachineStoryResolver } from './utils/createStateMachineStoryResolver';
import { loadStateMachineEntity } from './utils/loadStateMachineEntity';

const getProcessStateMachineGetState = (qpqConfig: QPQConfig): ProcessorFor<typeof askStateMachineGetState> => {
  return async (payload, session, actionProcessors, logger, updateSession, dynamicModuleLoader, streamRegistry) => {
    const smConfig = getStateMachineByName(qpqConfig, payload.stateMachineName);
    if (!smConfig) {
      return actionResultError(ErrorTypeEnum.NotFound, `State machine not found: ${payload.stateMachineName}`);
    }

    const resolveStory = createStateMachineStoryResolver(
      'StateMachine GetState',
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
    const entity = entityResult.result;

    // The snapshot round-trips through the key value store untyped.
    const persistedSnapshot = entity[smConfig.stateField] as Snapshot<unknown> | undefined;
    if (!persistedSnapshot) {
      return actionResultError(ErrorTypeEnum.NotFound, `No state machine state found on entity: ${payload.id}`);
    }

    // any: createMachine's setup generics cannot infer from a pre-typed MachineConfig; third-party boundary.
    const machine = createMachine(smConfig.config as any);
    const actor = createActor(machine, { snapshot: persistedSnapshot });
    actor.start();
    const snapshot = actor.getSnapshot();
    actor.stop();

    return actionResult({
      // Compound and parallel state values are objects; serialise them so
      // StateMachineStateInfo.value is always a string.
      value: typeof snapshot.value === 'string' ? snapshot.value : JSON.stringify(snapshot.value),
      done: snapshot.status === 'done',
    });
  };
};

export const getStateMachineGetStateActionProcessor = createActionProcessor(askStateMachineGetState, getProcessStateMachineGetState);
