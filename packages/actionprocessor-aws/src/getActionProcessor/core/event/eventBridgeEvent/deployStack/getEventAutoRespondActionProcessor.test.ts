import { DeployEventStatusType, DeployEventType, EventActionType } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventAutoRespondActionProcessor } from './getEventAutoRespondActionProcessor';

const config = buildTestQpqConfig();

const buildEvent = (stackName: string, status: string): any => ({
  detail: { 'status-details': { status }, 'stack-id': `arn:aws:cloudformation:us-east-1:1:stack/${stackName}/abc` },
});

describe('eventBridgeEvent/deployStack getEventAutoRespondActionProcessor', () => {
  it('early exits for an unknown deploy event', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor, EventActionType.AutoRespond, config);

    const result = await processor({
      qpqEventRecord: { deployEventType: DeployEventType.Unknown, deployEventStatusType: DeployEventStatusType.Update },
      matchResult: {},
    });

    expect(result).toEqual([undefined]);
  });

  it('does not early exit for a known deploy event', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor, EventActionType.AutoRespond, config);

    const result = await processor({
      qpqEventRecord: { deployEventType: DeployEventType.Api, deployEventStatusType: DeployEventStatusType.Update },
      matchResult: {},
    });

    expect(result).toEqual([null]);
  });
});
