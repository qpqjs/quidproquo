import { awsNamingUtils, qpqConfigAwsUtils } from '@qpqjs/config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askUserDirectoryGetUsers,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  transientErrorMap,
} from '@qpqjs/core';

import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { listPagedUsers } from '../../../logic/cognito/listPagedUsers';

const getProcessGetUsers = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryGetUsers> => {
  return async ({ userDirectoryName, nextPageKey }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const userPoolId = await getExportedValue(awsNamingUtils.getCFExportNameUserPoolIdFromConfig(userDirectoryName, qpqConfig), region);

    try {
      const userAttributes = await listPagedUsers(userPoolId, region, nextPageKey);

      return actionResult(userAttributes);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        ...transientErrorMap(),
        InvalidParameterException: () => actionResultError(askUserDirectoryGetUsers.errorType.InvalidPageKey, 'The supplied page key is invalid'),
        TooManyRequestsException: () =>
          actionResultError(askUserDirectoryGetUsers.errorType.LimitExceeded, 'Too many requests, please try again later'),
      });
    }
  };
};

export const getUserDirectoryGetUsersActionProcessor = createActionProcessor(askUserDirectoryGetUsers, getProcessGetUsers);
