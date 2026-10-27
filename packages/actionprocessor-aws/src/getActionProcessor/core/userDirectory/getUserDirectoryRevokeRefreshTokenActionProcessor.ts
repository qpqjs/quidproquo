import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askUserDirectoryRevokeRefreshToken,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { getCFExportNameUserPoolClientIdFromConfig, getCFExportNameUserPoolIdFromConfig } from '../../../awsNamingUtils';
import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { revokeRefreshToken } from '../../../logic/cognito/revokeRefreshToken';

const getProcessRevokeRefreshToken = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryRevokeRefreshToken> => {
  return async ({ userDirectoryName, refreshToken }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const userPoolId = await getExportedValue(getCFExportNameUserPoolIdFromConfig(userDirectoryName, qpqConfig), region);

    const userPoolClientId = await getExportedValue(getCFExportNameUserPoolClientIdFromConfig(userDirectoryName, qpqConfig), region);

    try {
      await revokeRefreshToken(userPoolId, userPoolClientId, region, refreshToken);

      return actionResult(void 0);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        NotAuthorizedException: () =>
          actionResultError(askUserDirectoryRevokeRefreshToken.errorType.Unauthorized, 'Refresh token is invalid or already revoked'),
        TooManyRequestsException: () =>
          actionResultError(askUserDirectoryRevokeRefreshToken.errorType.LimitExceeded, 'Too many attempts, please try again later'),
      });
    }
  };
};

export const getUserDirectoryRevokeRefreshTokenActionProcessor = createActionProcessor(
  askUserDirectoryRevokeRefreshToken,
  getProcessRevokeRefreshToken,
);
