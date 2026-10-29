import { awsNamingUtils } from '@qpqjs/config-aws';
import {
  actionResult,
  askEventGetRecordsBase,
  createActionProcessor,
  DeployEventStatusType,
  DeployEventType,
  ProcessorFor,
  QPQConfig,
} from '@qpqjs/core';

import { EventInput, InternalEventRecord } from './types';

const deployTypeMap: Record<string, DeployEventStatusType> = {
  UPDATE_COMPLETE: DeployEventStatusType.Update,
  CREATE_COMPLETE: DeployEventStatusType.Create,
  DELETE_COMPLETE: DeployEventStatusType.Delete,
};

const getProcessGetRecords = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventGetRecordsBase> => {
  return async ({ eventParams }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const [eventBridgeEvent] = eventParams as EventInput;

    const status = eventBridgeEvent.detail['status-details'].status || '';
    const stackId = eventBridgeEvent.detail['stack-id'];

    const regex = /:stack\/([^/]+)/;
    const match = stackId.match(regex);

    const stackName = match && match[1] ? match[1] : '';

    const internalEventRecord: InternalEventRecord = {
      deployEventType: DeployEventType.Unknown,
      deployEventStatusType: deployTypeMap[status] || DeployEventStatusType.Unknown,
    };

    if (stackName === awsNamingUtils.getApiStackName(qpqConfig)) {
      internalEventRecord.deployEventType = DeployEventType.Api;
    } else if (stackName === awsNamingUtils.getWebStackName(qpqConfig)) {
      internalEventRecord.deployEventType = DeployEventType.Web;
    }

    return actionResult([internalEventRecord]);
  };
};

export const getEventGetRecordsActionProcessor = createActionProcessor(askEventGetRecordsBase, getProcessGetRecords);
