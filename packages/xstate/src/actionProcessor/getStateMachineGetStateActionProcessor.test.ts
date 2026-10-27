import {
  ActionProcessor,
  actionResult,
  actionResultError,
  buildActionProcessorList,
  buildTestQpqConfig,
  buildTestStorySession,
  createStubLogger,
  ErrorTypeEnum,
  KeyValueStoreActionType,
  noopDynamicModuleLoader,
  QPQConfig,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';
import { createActor, createMachine } from 'xstate';

import { StateMachineActionType } from '../actions';
import { defineStateMachine } from '../config';
import { getStateMachineGetStateActionProcessor } from './getStateMachineGetStateActionProcessor';

const toggleConfig = {
  id: 'toggle',
  initial: 'inactive',
  states: {
    inactive: { on: { TOGGLE: 'active' } },
    active: { type: 'final' },
  },
} as any;

const parallelConfig = {
  id: 'parallel',
  type: 'parallel',
  states: {
    a: { initial: 'a1', states: { a1: {} } },
    b: { initial: 'b1', states: { b1: {} } },
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

const getProcessor = async (config: QPQConfig) => {
  const processors = await getStateMachineGetStateActionProcessor(config, noopDynamicModuleLoader);
  return processors[StateMachineActionType.GetState];
};

const invokeWith = (processor: ActionProcessor<any, any>, payload: any, entity: any) =>
  processor(
    payload,
    session,
    buildActionProcessorList({
      [KeyValueStoreActionType.Get]: async () => actionResult(entity),
    }),
    logger,
    updateSession,
    noopDynamicModuleLoader,
    undefined as any,
  );

const orderConfig = (machineConfig: any) => buildTestQpqConfig(defineStateMachine('order', { config: machineConfig }));

describe('getStateMachineGetStateActionProcessor', () => {
  it('returns a NotFound error when the state machine is not configured', async () => {
    const processor = await getProcessor(buildTestQpqConfig());

    const [, error] = await invokeWith(processor, { stateMachineName: 'missing', id: 'order-1' }, { id: 'order-1' });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('returns the underlying store error', async () => {
    const config = orderConfig(toggleConfig);
    const processors = await getStateMachineGetStateActionProcessor(config, noopDynamicModuleLoader);
    const processor = processors[StateMachineActionType.GetState];

    const [, error] = await processor(
      { stateMachineName: 'order', id: 'order-1' },
      session,
      buildActionProcessorList({
        [KeyValueStoreActionType.Get]: async () => actionResultError(ErrorTypeEnum.GenericError, 'kvs down'),
      }),
      logger,
      updateSession,
      noopDynamicModuleLoader,
      undefined as any,
    );

    expect(error?.errorText).toBe('kvs down');
  });

  it('returns a NotFound error when the entity does not exist', async () => {
    const processor = await getProcessor(orderConfig(toggleConfig));

    const [, error] = await invokeWith(processor, { stateMachineName: 'order', id: 'order-1' }, null);

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('returns a NotFound error when the entity has no persisted machine state', async () => {
    const processor = await getProcessor(orderConfig(toggleConfig));

    const [, error] = await invokeWith(processor, { stateMachineName: 'order', id: 'order-1' }, { id: 'order-1' });

    expect(error?.errorText).toContain('No state machine state');
  });

  it('returns the current state value and done flag', async () => {
    const processor = await getProcessor(orderConfig(toggleConfig));
    const entity = { id: 'order-1', __machineState: makeSnapshot(toggleConfig) };

    const [result] = await invokeWith(processor, { stateMachineName: 'order', id: 'order-1' }, entity);

    expect(result).toEqual({ value: 'inactive', done: false });
  });

  it('reports done when the machine has reached a final state', async () => {
    const processor = await getProcessor(orderConfig(toggleConfig));
    const entity = { id: 'order-1', __machineState: makeSnapshot(toggleConfig, [{ type: 'TOGGLE' }]) };

    const [result] = await invokeWith(processor, { stateMachineName: 'order', id: 'order-1' }, entity);

    expect(result).toEqual({ value: 'active', done: true });
  });

  it('serialises a compound state value to JSON', async () => {
    const processor = await getProcessor(orderConfig(parallelConfig));
    const entity = { id: 'order-1', __machineState: makeSnapshot(parallelConfig) };

    const [result] = await invokeWith(processor, { stateMachineName: 'order', id: 'order-1' }, entity);

    expect(result).toEqual({ value: JSON.stringify({ a: 'a1', b: 'b1' }), done: false });
  });
});
