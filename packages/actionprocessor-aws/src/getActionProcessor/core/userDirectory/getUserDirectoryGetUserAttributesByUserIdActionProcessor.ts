import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askUserDirectoryGetUserAttributesByUserId,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { getCFExportNameUserPoolIdFromConfig } from '../../../awsNamingUtils';
import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { getUserAttributesBySub } from '../../../logic/cognito/getUserAttributesBySub';

const getProcessGetUserAttributesByUserId = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryGetUserAttributesByUserId> => {
  return async ({ userDirectoryName, userId }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const userPoolId = await getExportedValue(getCFExportNameUserPoolIdFromConfig(userDirectoryName, qpqConfig), region);

    try {
      const userAttributes = await getUserAttributesBySub(userPoolId, region, userId);

      return actionResult(userAttributes);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        USER_NOT_FOUND: () => actionResultError(askUserDirectoryGetUserAttributesByUserId.errorType.UserNotFound, 'No user found for this userId'),
      });
    }
  };
};

export const getUserDirectoryGetUserAttributesByUserIdActionProcessor = createActionProcessor(
  askUserDirectoryGetUserAttributesByUserId,
  getProcessGetUserAttributesByUserId,
);
