import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  askUserDirectoryAssociateSoftwareToken,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

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
