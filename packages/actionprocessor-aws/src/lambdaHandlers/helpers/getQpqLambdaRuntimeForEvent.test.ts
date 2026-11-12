import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { QpqRuntimeType } from '@qpqjs/core';
import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { Context, SNSEvent } from 'aws-lambda';
import { describe, expect, it, vi } from 'vitest';

import { getAnyExecuteServiceFunctionEvent_serviceFunction } from '../getAnyExecuteServiceFunctionEvent_serviceFunction';
import { getQpqLambdaRuntimeForEvent } from './getQpqLambdaRuntimeForEvent';

const context = { getRemainingTimeInMillis: () => 10000 } as Context;
const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'ap-southeast-2')]);

const warmerPing = {
  Records: [{ EventSource: 'aws:sns', Sns: { Message: JSON.stringify({ type: 'QpqLambdaWarmerEvent' }) } }],
} as unknown as SNSEvent;

describe('getQpqLambdaRuntimeForEvent warmer pings', () => {
  it('answers a warmer ping without reading the event', async () => {
    const getStorySession = vi.fn();
    const handler = getQpqLambdaRuntimeForEvent(
      QpqRuntimeType.SERVICE_FUNCTION_EXE,
      getStorySession,
      async () => ({}),
      noopDynamicModuleLoader,
      qpqConfig,
    );

    expect(await handler(warmerPing as any, context)).toBe('Warmed up!');
    expect(getStorySession).not.toHaveBeenCalled();
  });

  // Regression: a service function reads its session from event.storySession, which a warmer ping does
  // not carry, so every ping threw "Cannot read properties of undefined (reading 'localContext')".
  it('answers a warmer ping sent to a service function', async () => {
    const handler = getAnyExecuteServiceFunctionEvent_serviceFunction(noopDynamicModuleLoader, qpqConfig);

    expect(await handler(warmerPing as any, context)).toBe('Warmed up!');
  });
});
