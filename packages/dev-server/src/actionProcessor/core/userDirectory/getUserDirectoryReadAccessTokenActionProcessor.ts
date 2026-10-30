import {
  actionResult,
  actionResultError,
  askUserDirectoryReadAccessToken,
  createActionProcessor,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
} from '@qpqjs/core';

import { decodeAccessTokenForDev } from '../../../logic/auth/decodeAccessTokenForDev';
import { resolveDevUserDirectory } from '../../../logic/auth/devAuth';
import { getOrSeedDevJwtSecret } from '../../../logic/auth/devJwtSecret';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessReadAccessToken = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askUserDirectoryReadAccessToken> => {
  return async ({ userDirectoryName, ignoreExpiration }, { decodedAccessToken, accessToken }) => {
    if (decodedAccessToken) {
      const nowInSeconds = Math.floor(Date.now() / 1000);

      // Prod parity: an unverified session decode (a bearer header on a route without token
      // auth, kept for the logs) is not an identity. Dev tokens without an exp claim decode to
      // exp 0 and are never "unexpired-but-unverified" by that rule, so check them by flag alone.
      if (!decodedAccessToken.wasValid && (decodedAccessToken.exp === 0 || decodedAccessToken.exp >= nowInSeconds)) {
        return actionResultError(ErrorTypeEnum.Unauthorized, 'Access token was not verified');
      }

      // Prod parity: the awslambda processor rejects a session-cached token that has
      // expired unless the caller opted out. Dev tokens without an exp claim decode
      // to exp 0 and never expire (same rule as decodeAccessTokenForDev).
      if (!ignoreExpiration && decodedAccessToken.exp > 0 && decodedAccessToken.exp < nowInSeconds) {
        return actionResultError(ErrorTypeEnum.Invalid, 'Access has expired');
      }

      return actionResult(decodedAccessToken);
    }

    const secret = await getOrSeedDevJwtSecret(devServerConfig.runtimePath, resolveDevUserDirectory(userDirectoryName, qpqConfig));
    const decoded = decodeAccessTokenForDev(secret, userDirectoryName, accessToken, ignoreExpiration);

    if (!decoded) {
      return actionResultError(ErrorTypeEnum.Unauthorized, 'Invalid accessToken');
    }

    return actionResult(decoded);
  };
};

export const getUserDirectoryReadAccessTokenActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askUserDirectoryReadAccessToken, (qpqConfig) => getProcessReadAccessToken(qpqConfig, devServerConfig));
