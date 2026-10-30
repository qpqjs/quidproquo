import {
  actionResult,
  actionResultError,
  askKeyValueStoreUpsert,
  createActionProcessor,
  ErrorTypeEnum,
  isErroredActionResult,
  ProcessorFor,
  QPQConfig,
  resolveActionResult,
  storyResultToActionResult,
} from '@qpqjs/core';

import { createActor, createMachine, Snapshot } from 'xstate';

import { askStateMachineSendEventBase } from '../actions';
import { getStateMachineByName } from '../config';
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
    if (isErroredActionResult(entityResult)) {
      return entityResult;
    }
    const entity = resolveActionResult(entityResult);

    // xstate guards are synchronous, so guard stories cannot run inside the
    // machine. Pre-evaluate every configured guard against the current entity
    // and event, and hand xstate constant implementations of the outcomes.
    const guardImpls: Record<string, () => boolean> = {};
    for (const [guardName, guardRuntime] of Object.entries(smConfig.guards)) {
      const guardModule = await dynamicModuleLoader(guardRuntime);
      if (!guardModule) {
        return actionResultError(ErrorTypeEnum.NotFound, `Guard story [${guardName}] could not be loaded`);
      }

      const guardResult = await resolveStory(guardModule, [entity, payload.event]);
      if (guardResult.error) {
        return storyResultToActionResult(guardResult, `StateMachine SendEvent guard ${guardName}`);
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
      return storyResultToActionResult(upsertResult, 'StateMachine SendEvent persist');
    }

    const sideEffectError = await runFiredActionStories(resolveStory, dynamicModuleLoader, smConfig, firedActions, [entity, payload.event]);
    if (sideEffectError) {
      return sideEffectError;
    }

    return actionResult(entity);
  };
};

export const getStateMachineSendEventActionProcessor = createActionProcessor(askStateMachineSendEventBase, getProcessStateMachineSendEvent);
