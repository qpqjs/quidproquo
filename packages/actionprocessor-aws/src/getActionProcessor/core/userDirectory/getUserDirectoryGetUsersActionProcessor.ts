import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askUserDirectoryGetUsers,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { getCFExportNameUserPoolIdFromConfig } from '../../../awsNamingUtils';
import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { listPagedUsers } from '../../../logic/cognito/listPagedUsers';

const getProcessGetUsers = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryGetUsers> => {
  return async ({ userDirectoryName, nextPageKey }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const userPoolId = await getExportedValue(getCFExportNameUserPoolIdFromConfig(userDirectoryName, qpqConfig), region);

    try {
      const userAttributes = await listPagedUsers(userPoolId, region, nextPageKey);

      return actionResult(userAttributes);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        InvalidParameterException: () => actionResultError(askUserDirectoryGetUsers.errorType.InvalidPageKey, 'The supplied page key is invalid'),
        TooManyRequestsException: () =>
          actionResultError(askUserDirectoryGetUsers.errorType.LimitExceeded, 'Too many requests, please try again later'),
      });
    }
  };
};

export const getUserDirectoryGetUsersActionProcessor = createActionProcessor(askUserDirectoryGetUsers, getProcessGetUsers);
