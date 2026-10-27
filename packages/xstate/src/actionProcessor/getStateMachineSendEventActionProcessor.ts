import {
  actionResult,
  actionResultError,
  askKeyValueStoreUpsert,
  createActionProcessor,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { createActor, createMachine, Snapshot } from 'xstate';

import { askStateMachineSendEventBase, StateMachineActionType } from '../actions';
import { getStateMachineByName } from '../config';
import { StateMachineEntity } from '../models/StateMachineEntity';
import { createFiredActionRecorder } from './utils/createFiredActionRecorder';
import { createStateMachineStoryResolver } from './utils/createStateMachineStoryResolver';
import { loadStateMachineEntity } from './utils/loadStateMachineEntity';
import { runFiredActionStories } from './utils/runFiredActionStories';

const getProcessStateMachineSendEvent = (qpqConfig: QPQConfig): ProcessorFor<typeof askStateMachineSendEventBase> => {
  return async (payload, session, actionProcessors, logger, updateSession, dynamicModuleLoader, streamRegistry) => {
    const smConfig = getStateMachineByName(qpqConfig, payload.stateMachineName);
    if (!smConfig) {
      return actionResultError(ErrorTypeEnum.NotFound, `State machine not found: ${payload.stateMachineName}`);
    }

    const resolveStory = createStateMachineStoryResolver(
      'StateMachine SendEvent',
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

    // xstate guards are synchronous, so guard stories cannot run inside the
    // machine. Pre-evaluate every configured guard against the current entity
    // and event, and hand xstate constant implementations of the outcomes.
    const guardImpls: Record<string, () => boolean> = {};
    for (const [guardName, guardRuntime] of Object.entries(smConfig.guards)) {
      const guardModule = await dynamicModuleLoader(guardRuntime);
      const guardResult = await resolveStory(guardModule, [entity, payload.event]);
      if (guardResult.error) {
        return actionResultError(guardResult.error.errorType, guardResult.error.errorText);
      }

      const guardOutcome: boolean = guardResult.result;
      guardImpls[guardName] = () => guardOutcome;
    }

    const { firedActions, actionImpls } = createFiredActionRecorder(Object.keys(smConfig.actions));

    // any: createMachine's setup generics cannot infer from a pre-typed MachineConfig; third-party boundary.
    const machine = createMachine(smConfig.config as any, { actions: actionImpls, guards: guardImpls });

    // The snapshot round-trips through the key value store untyped. Entities
    // written before the machine was configured may have none; the machine
    // then starts from its initial state.
    const persistedSnapshot = entity[smConfig.stateField] as Snapshot<unknown> | undefined;
    const actor = createActor(machine, { snapshot: persistedSnapshot || undefined });
    actor.start();

    // can() (with the guard outcomes resolved above) is the validity test:
    // comparing state values before and after the send would wrongly reject
    // internal and self transitions that keep the same state value.
    const currentSnapshot = actor.getSnapshot();
    if (!currentSnapshot.can(payload.event)) {
      actor.stop();
      return actionResultError(
        ErrorTypeEnum.BadRequest,
        `Event '${payload.event.type}' is not valid for current state '${JSON.stringify(currentSnapshot.value)}'`,
      );
    }

    actor.send(payload.event);
    const newSnapshot = actor.getPersistedSnapshot();
    actor.stop();

    entity[smConfig.stateField] = newSnapshot;
    const upsertResult = await resolveStory(function* askPersistEntity() {
      yield* askKeyValueStoreUpsert(smConfig.keyValueStoreName, entity);
    }, []);
    if (upsertResult.error) {
      return actionResultError(upsertResult.error.errorType, upsertResult.error.errorText);
    }

    const sideEffectError = await runFiredActionStories(resolveStory, dynamicModuleLoader, smConfig, firedActions, [entity, payload.event]);
    if (sideEffectError) {
      return actionResultError(sideEffectError.errorType, sideEffectError.errorText);
    }

    return actionResult(entity);
  };
};

export const getStateMachineSendEventActionProcessor = createActionProcessor(askStateMachineSendEventBase, getProcessStateMachineSendEvent);
