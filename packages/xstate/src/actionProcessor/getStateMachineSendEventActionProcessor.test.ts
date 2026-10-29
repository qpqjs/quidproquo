import {
  ActionProcessor,
  actionResult,
  actionResultError,
  DynamicModuleLoader,
  ErrorTypeEnum,
  KeyValueStoreActionType,
  QPQConfig,
} from '@qpqjs/core';
import { buildActionProcessorList, buildTestQpqConfig, buildTestStorySession, createStubLogger, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';
import { createActor, createMachine } from 'xstate';

import { StateMachineActionType } from '../actions';
import { defineStateMachine } from '../config';
import { getStateMachineSendEventActionProcessor } from './getStateMachineSendEventActionProcessor';

const toggleConfig = {
  id: 'toggle',
  initial: 'inactive',
  states: {
    inactive: { on: { TOGGLE: 'active' } },
    active: { on: { TOGGLE: 'inactive' } },
  },
} as any;

const guardedConfig = {
  id: 'guarded',
  initial: 'a',
  states: {
    a: { on: { GO: { target: 'b', guard: 'canGo' } } },
    b: {},
  },
} as any;

const actionConfig = {
  id: 'withAction',
  initial: 'a',
  states: {
    a: { on: { GO: { target: 'b', actions: ['notify'] } } },
    b: {},
  },
} as any;

const internalConfig = {
  id: 'internal',
  initial: 'a',
  states: {
    a: { on: { PING: { actions: ['notify'] } } },
  },
} as any;

const finalConfig = {
  id: 'final',
  initial: 'a',
  states: {
    a: { on: { FINISH: 'done' } },
    done: { type: 'final' },
  },
} as any;

const session = buildTestStorySession();
const logger = createStubLogger();
const updateSession = async () => {};

const makeSnapshot = (config: any, events: any[] = []) => {
  const actor = createActor(createMachine(config));
  actor.start();
  events.forEach((event) => actor.send(event));
  const snapshot = actor.getPersistedSnapshot();
  actor.stop();
  return snapshot;
};

const stateValueOf = (config: any, snapshot: any): unknown => {
  const actor = createActor(createMachine(config), { snapshot });
  actor.start();
  const value = actor.getSnapshot().value;
  actor.stop();
  return value;
};

const kvsStore = (store: Map<string, any>): Record<string, ActionProcessor<any, any>> => ({
  [KeyValueStoreActionType.Get]: async (payload: any) => actionResult(store.get(payload.key) ?? null),
  [KeyValueStoreActionType.Upsert]: async (payload: any) => {
    store.set(payload.item.id, payload.item);
    return actionResult(payload.item);
  },
});

const getProcessor = async (config: QPQConfig) => {
  const processors = await getStateMachineSendEventActionProcessor(config, noopDynamicModuleLoader);
  return processors[StateMachineActionType.SendEvent];
};

const invoke = (
  processor: ActionProcessor<any, any>,
  payload: any,
  processors: Record<string, ActionProcessor<any, any>>,
  loader: DynamicModuleLoader = noopDynamicModuleLoader,
) => processor(payload, session, buildActionProcessorList(processors), logger, updateSession, loader, undefined as any);

describe('getStateMachineSendEventActionProcessor', () => {
  it('returns a NotFound error when the state machine is not configured', async () => {
    const processor = await getProcessor(buildTestQpqConfig());

    const [, error] = await invoke(processor, { stateMachineName: 'missing', id: 'order-1', event: { type: 'TOGGLE' } }, kvsStore(new Map()));

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('returns the underlying store error', async () => {
    const processor = await getProcessor(buildTestQpqConfig(defineStateMachine('order', { config: toggleConfig })));

    const [, error] = await invoke(
      processor,
      { stateMachineName: 'order', id: 'order-1', event: { type: 'TOGGLE' } },
      {
        [KeyValueStoreActionType.Get]: async () => actionResultError(ErrorTypeEnum.GenericError, 'kvs down'),
      },
    );

    expect(error?.errorText).toBe('kvs down');
  });

  it('returns a NotFound error when the entity does not exist', async () => {
    const processor = await getProcessor(buildTestQpqConfig(defineStateMachine('order', { config: toggleConfig })));

    const [, error] = await invoke(processor, { stateMachineName: 'order', id: 'order-1', event: { type: 'TOGGLE' } }, kvsStore(new Map()));

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('transitions the machine and persists the new snapshot', async () => {
    const processor = await getProcessor(buildTestQpqConfig(defineStateMachine('order', { config: toggleConfig })));
    const store = new Map<string, any>([['order-1', { id: 'order-1', __machineState: makeSnapshot(toggleConfig) }]]);

    const [entity] = await invoke(processor, { stateMachineName: 'order', id: 'order-1', event: { type: 'TOGGLE' } }, kvsStore(store));

    expect(stateValueOf(toggleConfig, entity.__machineState)).toBe('active');
    expect(store.get('order-1')).toEqual(entity);
  });

  it('starts from the initial state when the entity has no persisted snapshot', async () => {
    const processor = await getProcessor(buildTestQpqConfig(defineStateMachine('order', { config: toggleConfig })));
    const store = new Map<string, any>([['order-1', { id: 'order-1' }]]);

    const [entity] = await invoke(processor, { stateMachineName: 'order', id: 'order-1', event: { type: 'TOGGLE' } }, kvsStore(store));

    expect(stateValueOf(toggleConfig, entity.__machineState)).toBe('active');
  });

  it('accepts a valid internal transition that keeps the same state value and runs its action story', async () => {
    const processor = await getProcessor(
      buildTestQpqConfig(defineStateMachine('order', { config: internalConfig, actions: { notify: 'rt' as any } })),
    );
    const store = new Map<string, any>([['order-1', { id: 'order-1', __machineState: makeSnapshot(internalConfig) }]]);
    let ran = 0;
    const loader = async () =>
      function* notify() {
        ran++;
      };

    const [entity, error] = await invoke(processor, { stateMachineName: 'order', id: 'order-1', event: { type: 'PING' } }, kvsStore(store), loader);

    expect(error).toBeUndefined();
    expect(entity).toBeDefined();
    expect(ran).toBe(1);
  });

  it('returns a BadRequest error when the machine has already reached its final state', async () => {
    const processor = await getProcessor(buildTestQpqConfig(defineStateMachine('order', { config: finalConfig })));
    const store = new Map<string, any>([['order-1', { id: 'order-1', __machineState: makeSnapshot(finalConfig, [{ type: 'FINISH' }]) }]]);

    const [, error] = await invoke(processor, { stateMachineName: 'order', id: 'order-1', event: { type: 'FINISH' } }, kvsStore(store));

    expect(error?.errorType).toBe(ErrorTypeEnum.BadRequest);
  });

  it('returns a BadRequest error when the event does not apply to the current state', async () => {
    const processor = await getProcessor(buildTestQpqConfig(defineStateMachine('order', { config: toggleConfig })));
    const store = new Map<string, any>([['order-1', { id: 'order-1', __machineState: makeSnapshot(toggleConfig) }]]);

    const [, error] = await invoke(processor, { stateMachineName: 'order', id: 'order-1', event: { type: 'UNKNOWN' } }, kvsStore(store));

    expect(error?.errorType).toBe(ErrorTypeEnum.BadRequest);
  });

  it('allows a transition when its guard story returns true', async () => {
    const processor = await getProcessor(buildTestQpqConfig(defineStateMachine('order', { config: guardedConfig, guards: { canGo: 'rt' as any } })));
    const store = new Map<string, any>([['order-1', { id: 'order-1', __machineState: makeSnapshot(guardedConfig) }]]);
    const loader = async () =>
      function* canGo() {
        return true;
      };

    const [entity] = await invoke(processor, { stateMachineName: 'order', id: 'order-1', event: { type: 'GO' } }, kvsStore(store), loader);

    expect(stateValueOf(guardedConfig, entity.__machineState)).toBe('b');
  });

  it('blocks a transition when its guard story returns false', async () => {
    const processor = await getProcessor(buildTestQpqConfig(defineStateMachine('order', { config: guardedConfig, guards: { canGo: 'rt' as any } })));
    const store = new Map<string, any>([['order-1', { id: 'order-1', __machineState: makeSnapshot(guardedConfig) }]]);
    const loader = async () =>
      function* canGo() {
        return false;
      };

    const [, error] = await invoke(processor, { stateMachineName: 'order', id: 'order-1', event: { type: 'GO' } }, kvsStore(store), loader);

    expect(error?.errorType).toBe(ErrorTypeEnum.BadRequest);
  });

  it('returns the error when a guard story fails', async () => {
    const processor = await getProcessor(buildTestQpqConfig(defineStateMachine('order', { config: guardedConfig, guards: { canGo: 'rt' as any } })));
    const store = new Map<string, any>([['order-1', { id: 'order-1', __machineState: makeSnapshot(guardedConfig) }]]);
    const loader = async () =>
      function* canGo() {
        throw new Error('guard failed');
      };

    const [, error] = await invoke(processor, { stateMachineName: 'order', id: 'order-1', event: { type: 'GO' } }, kvsStore(store), loader);

    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
    expect(error?.errorText).toBe('An unexpected error occurred [Error].');
  });

  it('runs the side-effect story for actions fired during the transition', async () => {
    const processor = await getProcessor(buildTestQpqConfig(defineStateMachine('order', { config: actionConfig, actions: { notify: 'rt' as any } })));
    const store = new Map<string, any>([['order-1', { id: 'order-1', __machineState: makeSnapshot(actionConfig) }]]);
    let ran = 0;
    const loader = async () =>
      function* notify() {
        ran++;
      };

    await invoke(processor, { stateMachineName: 'order', id: 'order-1', event: { type: 'GO' } }, kvsStore(store), loader);

    expect(ran).toBe(1);
  });

  it('returns the error when a fired side-effect story fails', async () => {
    const processor = await getProcessor(buildTestQpqConfig(defineStateMachine('order', { config: actionConfig, actions: { notify: 'rt' as any } })));
    const store = new Map<string, any>([['order-1', { id: 'order-1', __machineState: makeSnapshot(actionConfig) }]]);
    const loader = async () =>
      function* notify() {
        throw new Error('side effect failed');
      };

    const [, error] = await invoke(processor, { stateMachineName: 'order', id: 'order-1', event: { type: 'GO' } }, kvsStore(store), loader);

    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
    expect(error?.errorText).toBe('An unexpected error occurred [Error].');
  });

  it('returns the upsert error when persisting the new snapshot fails', async () => {
    const processor = await getProcessor(buildTestQpqConfig(defineStateMachine('order', { config: toggleConfig })));

    const [, error] = await invoke(
      processor,
      { stateMachineName: 'order', id: 'order-1', event: { type: 'TOGGLE' } },
      {
        [KeyValueStoreActionType.Get]: async () => actionResult({ id: 'order-1', __machineState: makeSnapshot(toggleConfig) }),
        [KeyValueStoreActionType.Upsert]: async () => actionResultError(ErrorTypeEnum.GenericError, 'upsert down'),
      },
    );

    expect(error?.errorText).toBe('upsert down');
  });
});
