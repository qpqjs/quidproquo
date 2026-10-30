import { awsNamingUtils } from '@qpqjs/config-aws';
import { DeployEventStatusType, DeployEventType, EventActionType } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';

const config = buildTestQpqConfig();

const buildEvent = (stackName: string, status: string): any => ({
  detail: { 'status-details': { status }, 'stack-id': `arn:aws:cloudformation:us-east-1:1:stack/${stackName}/abc` },
});

describe('eventBridgeEvent/deployStack getEventGetRecordsActionProcessor', () => {
  it('classifies an api stack update', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords, config);

    const [records] = await processor({ eventParams: [buildEvent(awsNamingUtils.getApiStackName(config), 'UPDATE_COMPLETE'), {}] });

    expect(records).toEqual([{ deployEventType: DeployEventType.Api, deployEventStatusType: DeployEventStatusType.Update }]);
  });

  it('classifies a web stack create', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords, config);

    const [records] = await processor({ eventParams: [buildEvent(awsNamingUtils.getWebStackName(config), 'CREATE_COMPLETE'), {}] });

    expect(records).toEqual([{ deployEventType: DeployEventType.Web, deployEventStatusType: DeployEventStatusType.Create }]);
  });

  // Security regression: the rule sees every stack status change in the account, so the api and web stacks of
  // another app, environment, feature or module in the same account must classify as Unknown and never run onDeploy.
  it.each([
    ['another app', buildTestQpqConfig([], { applicationName: 'other-app' })],
    ['another environment', buildTestQpqConfig([], { environment: 'production' })],
    ['a feature deployment', buildTestQpqConfig([], { feature: 'joe' })],
    ['another module', buildTestQpqConfig([], { moduleName: 'other-module' })],
  ])('classifies the api and web stacks of %s as unknown', async (_label: any, sibling: any) => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords, config);

    const [apiRecords] = await processor({ eventParams: [buildEvent(awsNamingUtils.getApiStackName(sibling), 'UPDATE_COMPLETE'), {}] });
    const [webRecords] = await processor({ eventParams: [buildEvent(awsNamingUtils.getWebStackName(sibling), 'CREATE_COMPLETE'), {}] });

    expect((apiRecords as any[])[0].deployEventType).toBe(DeployEventType.Unknown);
    expect((webRecords as any[])[0].deployEventType).toBe(DeployEventType.Unknown);
  });

  it('defaults to unknown for an unrelated stack and status', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords, config);

    const [records] = await processor({ eventParams: [buildEvent('some-other-stack', 'ROLLBACK'), {}] });

    expect(records).toEqual([{ deployEventType: DeployEventType.Unknown, deployEventStatusType: DeployEventStatusType.Unknown }]);
  });
});
