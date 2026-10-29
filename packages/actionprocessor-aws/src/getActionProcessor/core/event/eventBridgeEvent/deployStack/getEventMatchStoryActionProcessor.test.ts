import { defineDeployEvent, ErrorTypeEnum, EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';

const config = buildTestQpqConfig();

const buildEvent = (stackName: string, status: string): any => ({
  detail: { 'status-details': { status }, 'stack-id': `arn:aws:cloudformation:us-east-1:1:stack/${stackName}/abc` },
});

describe('eventBridgeEvent/deployStack getEventMatchStoryActionProcessor', () => {
  it('returns a NotFound error when no deploy event config matches', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor('deploy'), EventActionType.MatchStory, config);

    const [, error] = await processor({ qpqEventRecord: {} });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('returns the configured deploy event runtime', async () => {
    const runtime: QpqFunctionRuntime = '/entry/deploy::onDeploy';
    const withDeploy = buildTestQpqConfig([defineDeployEvent('deploy', runtime)]);
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor('deploy'), EventActionType.MatchStory, withDeploy);

    const [match] = await processor({ qpqEventRecord: {} });

    expect((match as any).runtime).toEqual(runtime);
  });
});
