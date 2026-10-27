import {
  buildTestQpqConfig,
  DeployEventStatusType,
  DeployEventType,
  ErrorTypeEnum,
  EventActionType,
  QPQCoreConfigSettingType,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getApiStackName, getWebStackName } from '../../../../../awsNamingUtils';
import { resolveEventProcessor } from '../../../../../testing/eventProcessorTestHelpers';
import { getEventAutoRespondActionProcessor } from './getEventAutoRespondActionProcessor';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';
import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

const config = buildTestQpqConfig();

const buildEvent = (stackName: string, status: string): any => ({
  detail: { 'status-details': { status }, 'stack-id': `arn:aws:cloudformation:us-east-1:1:stack/${stackName}/abc` },
});

describe('eventBridgeEvent/deployStack getEventGetRecordsActionProcessor', () => {
  it('classifies an api stack update', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords, config);

    const [records] = await processor({ eventParams: [buildEvent(getApiStackName(config), 'UPDATE_COMPLETE'), {}] });

    expect(records).toEqual([{ deployEventType: DeployEventType.Api, deployEventStatusType: DeployEventStatusType.Update }]);
  });

  it('classifies a web stack create', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords, config);

    const [records] = await processor({ eventParams: [buildEvent(getWebStackName(config), 'CREATE_COMPLETE'), {}] });

    expect(records).toEqual([{ deployEventType: DeployEventType.Web, deployEventStatusType: DeployEventStatusType.Create }]);
  });

  it('defaults to unknown for an unrelated stack and status', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords, config);

    const [records] = await processor({ eventParams: [buildEvent('some-other-stack', 'ROLLBACK'), {}] });

    expect(records).toEqual([{ deployEventType: DeployEventType.Unknown, deployEventStatusType: DeployEventStatusType.Unknown }]);
  });
});

describe('eventBridgeEvent/deployStack getEventMatchStoryActionProcessor', () => {
  it('returns a NotFound error when no deploy event config matches', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory, config);

    const [, error] = await processor({ qpqEventRecord: {} });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('returns the configured deploy event runtime', async () => {
    const runtime = { src: 'onDeploy' };
    // GLOBAL_DEPLOY_EVENT_NAME is read from process.env at import time (undefined in tests).
    const withDeploy = buildTestQpqConfig([{ configSettingType: QPQCoreConfigSettingType.deployEvent, name: undefined, runtime } as any]);
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory, withDeploy);

    const [match] = await processor({ qpqEventRecord: {} });

    expect((match as any).runtime).toEqual(runtime);
  });
});

describe('eventBridgeEvent/deployStack getEventTransformResponseResultActionProcessor', () => {
  it('returns void for a successful record', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult, config);

    expect(await processor({ eventParams: [{}], qpqEventRecordResponses: [{ success: true, result: {} }] })).toEqual([undefined]);
  });

  it('propagates a failed record as an error result', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult, config);

    const [, error] = await processor({
      eventParams: [{}],
      qpqEventRecordResponses: [{ success: false, error: { errorType: ErrorTypeEnum.GenericError, errorText: 'boom' } }],
    });

    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
  });
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

describe('eventBridgeEvent/deployStack getEventGetStorySessionActionProcessor', () => {
  it('returns no story session', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession, config);

    expect(await processor({ qpqEventRecord: {}, eventParams: [] })).toEqual([undefined]);
  });
});
