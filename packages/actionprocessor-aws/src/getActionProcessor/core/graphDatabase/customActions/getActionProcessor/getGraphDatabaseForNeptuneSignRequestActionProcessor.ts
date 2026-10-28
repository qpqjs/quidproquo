import { qpqConfigAwsUtils } from '@qpqjs/config-aws';
import { actionResult, actionResultErrorFromCaughtError, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

import { defaultProvider } from '@aws-sdk/credential-provider-node';

import { signNeptuneRequest } from '../../../../../logic/neptune';
import { askGraphDatabaseForNeptuneSignRequest, GraphDatabaseForNeptuneActionType } from '../actions';

const getProcessSignRequest = (qpqConfig: QPQConfig): ProcessorFor<typeof askGraphDatabaseForNeptuneSignRequest> => {
  return async ({ url, body }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      const credentials = await defaultProvider()();
      const headers = await signNeptuneRequest(url, body, region, credentials);

      return actionResult(headers);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {});
    }
  };
};

export const getGraphDatabaseForNeptuneSignRequestActionProcessor = createActionProcessor(
  askGraphDatabaseForNeptuneSignRequest,
  getProcessSignRequest,
);
