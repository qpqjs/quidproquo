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

import { StateMachineActionType } from '../actions';
import { defineStateMachine } from '../config';
import { getStateMachineGetActionProcessor } from './getStateMachineGetActionProcessor';

const toggleConfig = {
  id: 'toggle',
  initial: 'inactive',
  states: { inactive: {}, active: {} },
} as any;

const session = buildTestStorySession();
const logger = createStubLogger();
const updateSession = async () => {};

const getProcessor = async (config: QPQConfig) => {
  const processors = await getStateMachineGetActionProcessor(config, noopDynamicModuleLoader);
  return processors[StateMachineActionType.Get];
};

const invoke = (processor: ActionProcessor<any, any>, payload: any, processors: Record<string, ActionProcessor<any, any>>) =>
  processor(payload, session, buildActionProcessorList(processors), logger, updateSession, noopDynamicModuleLoader, undefined as any);

const orderConfig = () => buildTestQpqConfig(defineStateMachine('order', { config: toggleConfig }));

describe('getStateMachineGetActionProcessor', () => {
  it('returns a NotFound error when the state machine is not configured', async () => {
    const processor = await getProcessor(buildTestQpqConfig());

    const [, error] = await invoke(processor, { stateMachineName: 'missing', id: 'order-1' }, {});

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('returns the underlying store error', async () => {
    const processor = await getProcessor(orderConfig());

    const [, error] = await invoke(
      processor,
      { stateMachineName: 'order', id: 'order-1' },
      {
        [KeyValueStoreActionType.Get]: async () => actionResultError(ErrorTypeEnum.GenericError, 'kvs down'),
      },
    );

    expect(error?.errorText).toBe('kvs down');
  });

  it('returns a NotFound error when the entity does not exist', async () => {
    const processor = await getProcessor(orderConfig());

    const [, error] = await invoke(
      processor,
      { stateMachineName: 'order', id: 'order-1' },
      {
        [KeyValueStoreActionType.Get]: async () => actionResult(null),
      },
    );

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('returns the stored entity', async () => {
    const processor = await getProcessor(orderConfig());
    const entity = { id: 'order-1', total: 10 };

    const [result] = await invoke(
      processor,
      { stateMachineName: 'order', id: 'order-1' },
      {
        [KeyValueStoreActionType.Get]: async () => actionResult(entity),
      },
    );

    expect(result).toEqual(entity);
  });
});
