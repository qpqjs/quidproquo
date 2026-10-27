import {
  actionResult,
  actionResultError,
  askKeyValueStoreUpsert,
  createActionProcessor,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { createActor, createMachine } from 'xstate';

import { askStateMachineCreateBase, StateMachineActionType } from '../actions';
import { getStateMachineByName } from '../config';
import { StateMachineEntity } from '../models/StateMachineEntity';
import { createFiredActionRecorder } from './utils/createFiredActionRecorder';
import { createStateMachineStoryResolver } from './utils/createStateMachineStoryResolver';
import { runFiredActionStories } from './utils/runFiredActionStories';

const getProcessStateMachineCreate = (qpqConfig: QPQConfig): ProcessorFor<typeof askStateMachineCreateBase> => {
  return async (payload, session, actionProcessors, logger, updateSession, dynamicModuleLoader, streamRegistry) => {
    const smConfig = getStateMachineByName(qpqConfig, payload.stateMachineName);
    if (!smConfig) {
      return actionResultError(ErrorTypeEnum.NotFound, `State machine not found: ${payload.stateMachineName}`);
    }

    const resolveStory = createStateMachineStoryResolver(
      'StateMachine Create',
      qpqConfig,
      session,
      actionProcessors,
      logger,
      dynamicModuleLoader,
      streamRegistry,
    );

    // Start a throwaway actor to capture the initial snapshot and record any
    // entry actions the initial state fires; their stories run after the
    // entity has been persisted.
    const { firedActions, actionImpls } = createFiredActionRecorder(Object.keys(smConfig.actions));

    // any: createMachine's setup generics cannot infer from a pre-typed MachineConfig; third-party boundary.
    const machine = createMachine(smConfig.config as any, { actions: actionImpls });

    const actor = createActor(machine);
    actor.start();
    const initialSnapshot = actor.getPersistedSnapshot();
    actor.stop();

    const entity: StateMachineEntity = { ...(payload.item as Record<string, unknown>), id: payload.id };
    entity[smConfig.stateField] = initialSnapshot;

    const upsertResult = await resolveStory(function* askPersistEntity() {
      yield* askKeyValueStoreUpsert(smConfig.keyValueStoreName, entity);
    }, []);
    if (upsertResult.error) {
      return actionResultError(upsertResult.error.errorType, upsertResult.error.errorText);
    }

    const sideEffectError = await runFiredActionStories(resolveStory, dynamicModuleLoader, smConfig, firedActions, [entity]);
    if (sideEffectError) {
      return actionResultError(sideEffectError.errorType, sideEffectError.errorText);
    }

    return actionResult(entity);
  };
};

export const getStateMachineCreateActionProcessor = createActionProcessor(askStateMachineCreateBase, getProcessStateMachineCreate);
