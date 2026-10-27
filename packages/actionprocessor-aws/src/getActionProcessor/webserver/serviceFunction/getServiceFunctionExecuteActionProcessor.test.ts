import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig, buildTestStorySession } from 'quidproquo-core';
import { ServiceFunctionActionType } from 'quidproquo-webserver';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { executeLambdaByName } from '../../../logic/lambda/executeLambdaByName';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getServiceFunctionExecuteActionProcessor } from './getServiceFunctionExecuteActionProcessor';

vi.mock('../../../logic/lambda/executeLambdaByName', () => ({
  executeLambdaByName: vi.fn(),
}));

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);
  const processors = await getServiceFunctionExecuteActionProcessor(config, {} as any);
  return processors[ServiceFunctionActionType.Execute];
};

const invoke = (processor: any) =>
  invokeProcessor(processor, { functionName: 'doThing', service: 'auth', payload: [1], isAsync: false }, { session: buildTestStorySession() });

describe('getServiceFunctionExecuteActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(executeLambdaByName).mockReset();
  });

  it('invokes the resolved service-function lambda name', async () => {
    vi.mocked(executeLambdaByName).mockResolvedValue({ success: true, result: 'ok' } as any);
    const processor = await resolveProcessor();

    const result = await invoke(processor);

    expect(result).toEqual(['ok']);
    expect(vi.mocked(executeLambdaByName).mock.calls[0][0]).toBe('doThing-sfunc-test-app-auth-development');
  });

  it('returns void when the lambda produces no result', async () => {
    vi.mocked(executeLambdaByName).mockResolvedValue(undefined as any);
    const processor = await resolveProcessor();

    expect(await invoke(processor)).toEqual([undefined]);
  });

  it('propagates the remote error when the lambda result is unsuccessful', async () => {
    vi.mocked(executeLambdaByName).mockResolvedValue({ success: false, error: { errorType: 'BadThing', errorText: 'nope' } } as any);
    const processor = await resolveProcessor();

    const [, error] = await invoke(processor);

    expect(error?.errorType).toBe('BadThing');
    expect(error?.errorText).toBe('nope');
  });
});
