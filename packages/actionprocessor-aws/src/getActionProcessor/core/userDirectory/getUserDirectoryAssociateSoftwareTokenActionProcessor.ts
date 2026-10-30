import { qpqConfigAwsUtils } from '@qpqjs/config-aws';
import { actionResult, askUserDirectoryAssociateSoftwareToken, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

import { associateSoftwareToken } from '../../../logic/cognito/associateSoftwareToken';

const getProcessAssociateSoftwareToken = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryAssociateSoftwareToken> => {
  return async ({ session }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const response = await associateSoftwareToken(region, session);

    return actionResult(response);
  };
};

export const getUserDirectoryAssociateSoftwareTokenActionProcessor = createActionProcessor(
  askUserDirectoryAssociateSoftwareToken,
  getProcessAssociateSoftwareToken,
);
