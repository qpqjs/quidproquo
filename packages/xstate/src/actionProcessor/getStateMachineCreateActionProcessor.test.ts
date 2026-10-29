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

import { StateMachineActionType } from '../actions';
import { defineStateMachine } from '../config';
import { getStateMachineCreateActionProcessor } from './getStateMachineCreateActionProcessor';

const toggleConfig = {
  id: 'toggle',
  initial: 'inactive',
  states: {
    inactive: { on: { TOGGLE: 'active' } },
    active: { on: { TOGGLE: 'inactive' } },
  },
} as any;

const session = buildTestStorySession();
const logger = createStubLogger();
const updateSession = async () => {};

const kvsStore = (store: Map<string, any>): Record<string, ActionProcessor<any, any>> => ({
  [KeyValueStoreActionType.Get]: async (payload: any) => actionResult(store.get(payload.key) ?? null),
  [KeyValueStoreActionType.Upsert]: async (payload: any) => {
    store.set(payload.item.id, payload.item);
    return actionResult(payload.item);
  },
});

const getProcessor = async (config: QPQConfig) => {
  const processors = await getStateMachineCreateActionProcessor(config, noopDynamicModuleLoader);
  return processors[StateMachineActionType.Create];
};

const invoke = (
  processor: ActionProcessor<any, any>,
  payload: any,
  processors: Record<string, ActionProcessor<any, any>>,
  loader: DynamicModuleLoader = noopDynamicModuleLoader,
) => processor(payload, session, buildActionProcessorList(processors), logger, updateSession, loader, undefined as any);

describe('getStateMachineCreateActionProcessor', () => {
  it('returns a NotFound error when the state machine is not configured', async () => {
    const processor = await getProcessor(buildTestQpqConfig());

    const [, error] = await invoke(processor!, { stateMachineName: 'missing', id: 'id-1', item: {} }, kvsStore(new Map()));

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('persists the entity with the initial machine snapshot and returns it', async () => {
    const config = buildTestQpqConfig(defineStateMachine('order', { config: toggleConfig }));
    const processor = await getProcessor(config);
    const store = new Map<string, any>();

    const [entity] = await invoke(processor!, { stateMachineName: 'order', id: 'order-1', item: { total: 10 } }, kvsStore(store));

    expect(entity).toEqual({ id: 'order-1', total: 10, __machineState: expect.objectContaining({ value: 'inactive' }) });
    expect(store.get('order-1')).toEqual(entity);
  });

  it('returns the upsert error when persistence fails', async () => {
    const config = buildTestQpqConfig(defineStateMachine('order', { config: toggleConfig }));
    const processor = await getProcessor(config);

    const [, error] = await invoke(
      processor!,
      { stateMachineName: 'order', id: 'order-1', item: {} },
      {
        [KeyValueStoreActionType.Upsert]: async () => actionResultError(ErrorTypeEnum.GenericError, 'kvs down'),
      },
    );

    expect(error?.errorText).toBe('kvs down');
  });

  it('runs the side-effect story for initial entry actions', async () => {
    const entryConfig = {
      id: 'order',
      initial: 'created',
      states: { created: { entry: ['onCreated'] } },
    } as any;
    const config = buildTestQpqConfig(defineStateMachine('order', { config: entryConfig, actions: { onCreated: 'rt' as any } }));
    const processor = await getProcessor(config);

    let ran = 0;
    const loader = async () =>
      function* onCreated() {
        ran++;
      };

    await invoke(processor!, { stateMachineName: 'order', id: 'order-1', item: {} }, kvsStore(new Map()), loader);

    expect(ran).toBe(1);
  });

  it('returns the error when a side-effect story fails', async () => {
    const entryConfig = {
      id: 'order',
      initial: 'created',
      states: { created: { entry: ['onCreated'] } },
    } as any;
    const config = buildTestQpqConfig(defineStateMachine('order', { config: entryConfig, actions: { onCreated: 'rt' as any } }));
    const processor = await getProcessor(config);

    const loader = async () =>
      function* onCreated() {
        throw new Error('side effect failed');
      };

    const [, error] = await invoke(processor!, { stateMachineName: 'order', id: 'order-1', item: {} }, kvsStore(new Map()), loader);

    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
    expect(error?.errorText).toBe('An unexpected error occurred [Error].');
  });
});
