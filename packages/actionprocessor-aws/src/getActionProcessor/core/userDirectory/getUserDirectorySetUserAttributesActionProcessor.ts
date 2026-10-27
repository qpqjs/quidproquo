import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askUserDirectorySetUserAttributes,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { getCFExportNameUserPoolIdFromConfig } from '../../../awsNamingUtils';
import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { resolveUsernameByPreferredUsername } from '../../../logic/cognito/resolveUsernameByPreferredUsername';
import { setUserAttributes } from '../../../logic/cognito/setUserAttributes';

const getProcessSetUserAttributes = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectorySetUserAttributes> => {
  return async ({ userDirectoryName, username, userAttributes }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const userPoolId = await getExportedValue(getCFExportNameUserPoolIdFromConfig(userDirectoryName, qpqConfig), region);

    const resolvedUsername = await resolveUsernameByPreferredUsername(userPoolId, region, username);

    try {
      await setUserAttributes(userPoolId, region, resolvedUsername, userAttributes);

      return actionResult(void 0);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        UserNotFoundException: () => actionResultError(askUserDirectorySetUserAttributes.errorType.UserNotFound, 'No account found for this user'),
        InvalidParameterException: () =>
          actionResultError(askUserDirectorySetUserAttributes.errorType.InvalidAttributes, 'One or more attributes are invalid'),
        AliasExistsException: () =>
          actionResultError(askUserDirectorySetUserAttributes.errorType.AliasExists, 'That email or phone number is already in use'),
        LimitExceededException: () =>
          actionResultError(askUserDirectorySetUserAttributes.errorType.LimitExceeded, 'Too many attempts, please try again later'),
        TooManyRequestsException: () =>
          actionResultError(askUserDirectorySetUserAttributes.errorType.LimitExceeded, 'Too many attempts, please try again later'),
      });
    }
  };
};

export const getUserDirectorySetUserAttributesActionProcessor = createActionProcessor(askUserDirectorySetUserAttributes, getProcessSetUserAttributes);
