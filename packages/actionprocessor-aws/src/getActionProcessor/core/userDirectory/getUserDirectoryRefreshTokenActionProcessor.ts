import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askUserDirectoryRefreshToken,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { getCFExportNameUserPoolClientIdFromConfig, getCFExportNameUserPoolIdFromConfig } from '../../../awsNamingUtils';
import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { refreshToken as cognitoRefreshToken } from '../../../logic/cognito/refreshToken';

const getProcessRefreshToken = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryRefreshToken> => {
  return async ({ userDirectoryName, refreshToken }, session) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const userPoolId = await getExportedValue(getCFExportNameUserPoolIdFromConfig(userDirectoryName, qpqConfig), region);

    const userPoolClientId = await getExportedValue(getCFExportNameUserPoolClientIdFromConfig(userDirectoryName, qpqConfig), region);

    if (!session.decodedAccessToken || !session.decodedAccessToken.username) {
      return actionResultError(askUserDirectoryRefreshToken.errorType.Unauthorized, 'Invalid accessToken');
    }

    // NOTE: we intentionally do NOT gate on decodedAccessToken.wasValid here.
    // Refresh must accept a signature-valid-but-expired access token (that's the
    // point of refreshing), and wasValid folds in the expiry check. The trust
    // anchor for this operation is the refreshToken itself: Cognito's
    // REFRESH_TOKEN_AUTH validates it and the SECRET_HASH binds it to `username`,
    // so a forged/unverified username cannot mint tokens for another user.

    try {
      const authResponse = await cognitoRefreshToken(userPoolId, userPoolClientId, region, session.decodedAccessToken.username, refreshToken);

      return actionResult(authResponse);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        NotAuthorizedException: () =>
          actionResultError(askUserDirectoryRefreshToken.errorType.Unauthorized, 'Refresh token is invalid or has expired'),
        TooManyRequestsException: () =>
          actionResultError(askUserDirectoryRefreshToken.errorType.LimitExceeded, 'Too many attempts, please try again later'),
      });
    }
  };
};

export const getUserDirectoryRefreshTokenActionProcessor = createActionProcessor(askUserDirectoryRefreshToken, getProcessRefreshToken);
