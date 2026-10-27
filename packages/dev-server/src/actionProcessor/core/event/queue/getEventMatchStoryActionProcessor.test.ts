import {
  buildTestQpqConfig,
  defineQueue,
  ErrorTypeEnum,
  EventActionType,
  isErroredActionResult,
  noopDynamicModuleLoader,
  resolveActionResult,
  resolveActionResultError,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { invokeProcessor } from '../../../../testing/testProcessorRuntime';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';

const runtime = '/entry::onOrder' as const;

const buildConfig = () => buildTestQpqConfig([defineQueue('my-queue', { 'order.created': runtime })]);

const invoke = async (qpqConfig: any, messageType: string) => {
  const processors = await getEventMatchStoryActionProcessor(qpqConfig, noopDynamicModuleLoader);
  const process = processors[EventActionType.MatchStory];
  return invokeProcessor(process, { qpqEventRecord: { message: { type: messageType } }, eventParams: [{ queueName: 'my-queue' }] } as any);
};

describe('getEventMatchStoryActionProcessor (queue)', () => {
  it('matches a queue processor by message type and returns its runtime', async () => {
    const result = await invoke(buildConfig(), 'order.created');

    const match = resolveActionResult(result);
    expect(match.runtime).toBe(runtime);
    expect(match.config).toBe('order.created');
  });

  it('returns a NotFound error when no queue processor matches', async () => {
    const result = await invoke(buildConfig(), 'order.deleted');

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.NotFound);
    expect(resolveActionResultError(result).errorText).toContain('queue type not found');
  });
});
