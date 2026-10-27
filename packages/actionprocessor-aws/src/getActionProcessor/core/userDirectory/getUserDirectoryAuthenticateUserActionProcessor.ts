import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askUserDirectoryAuthenticateUserBase,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { getCFExportNameUserPoolClientIdFromConfig, getCFExportNameUserPoolIdFromConfig } from '../../../awsNamingUtils';
import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { authenticateUser } from '../../../logic/cognito/authenticateUser';
import { resolveUsernameByPreferredUsername } from '../../../logic/cognito/resolveUsernameByPreferredUsername';

const getProcessAuthenticateUser = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryAuthenticateUserBase> => {
  return async (payload) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);
    const userPoolId = await getExportedValue(getCFExportNameUserPoolIdFromConfig(payload.userDirectoryName, qpqConfig), region);
    const userPoolClientId = await getExportedValue(getCFExportNameUserPoolClientIdFromConfig(payload.userDirectoryName, qpqConfig), region);

    try {
      const resolvedUsername = await resolveUsernameByPreferredUsername(userPoolId, region, payload.authenticateUserRequest.email);

      const authResponse = await authenticateUser(
        userPoolId,
        userPoolClientId,
        region,
        payload.authenticateUserRequest.isCustom,
        resolvedUsername,
        payload.authenticateUserRequest.password,
      );

      return actionResult(authResponse);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        UserNotFoundException: () => actionResultError(askUserDirectoryAuthenticateUserBase.errorType.UserNotFound, 'Incorrect username or password'),
        NotAuthorizedException: () =>
          actionResultError(askUserDirectoryAuthenticateUserBase.errorType.UserNotFound, 'Incorrect username or password'),
      });
    }
  };
};

export const getUserDirectoryAuthenticateUserActionProcessor = createActionProcessor(
  askUserDirectoryAuthenticateUserBase,
  getProcessAuthenticateUser,
);
