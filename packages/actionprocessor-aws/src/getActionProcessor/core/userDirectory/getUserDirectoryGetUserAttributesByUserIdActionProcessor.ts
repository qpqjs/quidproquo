import { awsNamingUtils, qpqConfigAwsUtils } from '@qpqjs/config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askUserDirectoryGetUserAttributesByUserId,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  transientErrorMap,
} from '@qpqjs/core';

import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { getUserAttributesBySub } from '../../../logic/cognito/getUserAttributesBySub';

const getProcessGetUserAttributesByUserId = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryGetUserAttributesByUserId> => {
  return async ({ userDirectoryName, userId }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const userPoolId = await getExportedValue(awsNamingUtils.getCFExportNameUserPoolIdFromConfig(userDirectoryName, qpqConfig), region);

    try {
      const userAttributes = await getUserAttributesBySub(userPoolId, region, userId);

      return actionResult(userAttributes);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        ...transientErrorMap(),
        USER_NOT_FOUND: () => actionResultError(askUserDirectoryGetUserAttributesByUserId.errorType.UserNotFound, 'No user found for this userId'),
      });
    }
  };
};

export const getUserDirectoryGetUserAttributesByUserIdActionProcessor = createActionProcessor(
  askUserDirectoryGetUserAttributesByUserId,
  getProcessGetUserAttributesByUserId,
);
