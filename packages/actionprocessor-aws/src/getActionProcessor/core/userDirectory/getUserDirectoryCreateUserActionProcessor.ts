import { awsNamingUtils, qpqConfigAwsUtils } from '@qpqjs/config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askUserDirectoryCreateUser,
  AuthenticateUserResponse,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  transientErrorMap,
} from '@qpqjs/core';

import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { createUser } from '../../../logic/cognito/createUser';
import { resolveUsernameByPreferredUsername } from '../../../logic/cognito/resolveUsernameByPreferredUsername';

const getProcessCreateUser = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryCreateUser> => {
  return async (payload) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const userPoolId = await getExportedValue(awsNamingUtils.getCFExportNameUserPoolIdFromConfig(payload.userDirectoryName, qpqConfig), region);

    const userPoolClientId = await getExportedValue(
      awsNamingUtils.getCFExportNameUserPoolClientIdFromConfig(payload.userDirectoryName, qpqConfig),
      region,
    );

    const resolvedUsername = await resolveUsernameByPreferredUsername(userPoolId, region, payload.createUserRequest.email);
    if (resolvedUsername !== payload.createUserRequest.email) {
      return actionResultError(askUserDirectoryCreateUser.errorType.Conflict, 'An account with this email already exists');
    }

    try {
      const authResponse: AuthenticateUserResponse = await createUser(userPoolId, region, userPoolClientId, payload.createUserRequest);

      return actionResult(authResponse);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        ...transientErrorMap(),
        UsernameExistsException: () => actionResultError(askUserDirectoryCreateUser.errorType.Conflict, 'An account with this email already exists'),
        InvalidPasswordException: () =>
          actionResultError(askUserDirectoryCreateUser.errorType.InvalidPassword, 'Password does not meet the password policy'),
        LimitExceededException: () =>
          actionResultError(askUserDirectoryCreateUser.errorType.LimitExceeded, 'Too many attempts, please try again later'),
      });
    }
  };
};

export const getUserDirectoryCreateUserActionProcessor = createActionProcessor(askUserDirectoryCreateUser, getProcessCreateUser);
