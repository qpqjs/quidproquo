import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig, buildTestStorySession } from '@qpqjs/testing';
import { ServiceFunctionActionType } from '@qpqjs/webserver';

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

  // Security regression: the invoke payload that crosses to another service carries the cross-service session,
  // never the caller's raw bearer token, local context or function globals.
  it('strips the token, local context and function globals from the session it sends', async () => {
    vi.mocked(executeLambdaByName).mockResolvedValue({ success: true, result: 'ok' } as any);
    const processor = await resolveProcessor();
    const session = {
      ...buildTestStorySession(),
      accessToken: 'raw-bearer-token',
      localContext: { secretThing: 'x' },
      functionGlobals: { apiKey: 'k' },
    } as any;

    await invokeProcessor(processor, { functionName: 'doThing', service: 'auth', payload: [1], isAsync: false }, { session });

    const payload = vi
      .mocked(executeLambdaByName)
      .mock.calls[0].find((arg) => arg && typeof arg === 'object' && 'storySession' in (arg as any)) as any;
    expect(payload.storySession.accessToken).toBeUndefined();
    expect(payload.storySession.localContext).toBeUndefined();
    expect(payload.storySession.functionGlobals).toBeUndefined();
    expect(JSON.stringify(vi.mocked(executeLambdaByName).mock.calls[0])).not.toContain('raw-bearer-token');
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
