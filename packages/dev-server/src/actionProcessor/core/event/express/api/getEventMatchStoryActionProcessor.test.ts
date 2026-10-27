import {
  buildTestQpqConfig,
  ErrorTypeEnum,
  EventActionType,
  isErroredActionResult,
  noopDynamicModuleLoader,
  resolveActionResult,
  resolveActionResultError,
} from 'quidproquo-core';
import { defineRoute } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { invokeProcessor } from '../../../../../testing/testProcessorRuntime';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';

const runtime = '/entry::onGet' as const;

const buildConfigWithRoute = () => buildTestQpqConfig([defineRoute('GET', '/users/{id}', runtime)]);

const invoke = async (qpqConfig: any, qpqEventRecord: any) => {
  const processors = await getEventMatchStoryActionProcessor(qpqConfig, noopDynamicModuleLoader);
  const process = processors[EventActionType.MatchStory];
  return invokeProcessor(process, { qpqEventRecord, eventParams: [{ headers: {} }] } as any);
};

describe('getEventMatchStoryActionProcessor (express)', () => {
  it('matches a route and returns its runtime, params and merged config', async () => {
    const result = await invoke(buildConfigWithRoute(), { method: 'GET', path: '/users/42', headers: {} });

    const match = resolveActionResult(result);
    expect(match.runtime).toBe(runtime);
    expect(match.runtimeOptions).toEqual({ id: '42' });
    expect(match.config).toBeDefined();
  });

  it('matches any route method when the request method is OPTIONS', async () => {
    const result = await invoke(buildConfigWithRoute(), { method: 'OPTIONS', path: '/users/42', headers: {} });

    expect(resolveActionResult(result).runtime).toBe(runtime);
  });

  it('returns a NotFound error when no route matches', async () => {
    const result = await invoke(buildConfigWithRoute(), { method: 'GET', path: '/missing', headers: {} });

    expect(isErroredActionResult(result)).toBe(true);
    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.NotFound);
    expect(resolveActionResultError(result).errorText).toContain('route not found');
  });
});
