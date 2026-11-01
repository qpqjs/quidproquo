import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askUserDirectoryRefreshToken,
  createActionProcessor,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
} from '@qpqjs/core';

import { createDevAuthResponse, resolveDevUserDirectory } from '../../../logic/auth/devAuth';
import { getOrSeedDevJwtSecret } from '../../../logic/auth/devJwtSecret';
import { getDevUserByUserId, upsertDevUser } from '../../../logic/auth/jsonUserStore';
import { verifyDevJwt } from '../../../logic/auth/verifyDevJwt';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessRefreshToken = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askUserDirectoryRefreshToken> => {
  return async ({ userDirectoryName, refreshToken }) => {
    try {
      // Keep the same user the refresh token was minted for, falling back to the dev user. The
      // token has to be one this directory signed, as a pool would insist.
      const userDirectory = resolveDevUserDirectory(userDirectoryName, qpqConfig);
      const secret = await getOrSeedDevJwtSecret(devServerConfig.runtimePath, userDirectory);
      const decoded = verifyDevJwt<{ username?: string; email?: string; sub?: string; exp?: number }>(secret, refreshToken);
      if (!decoded) {
        return actionResultError(ErrorTypeEnum.Unauthorized, 'Invalid refresh token');
      }

      // verifyDevJwt checks the signature only. A refresh token past its expiry is refused the way a pool
      // refuses one (NotAuthorized), rather than minting fresh tokens for as long as the secret lives.
      if (typeof decoded.exp === 'number' && decoded.exp < Math.floor(Date.now() / 1000)) {
        return actionResultError(ErrorTypeEnum.Unauthorized, 'Refresh token is invalid or has expired');
      }

      // A token carrying only a sub (userId) resolves back to its email through the user store
      let username = decoded?.username || decoded?.email;
      if (!username && decoded?.sub) {
        username = (await getDevUserByUserId(devServerConfig.runtimePath, userDirectory, decoded.sub))?.email;
      }

      await upsertDevUser(devServerConfig.runtimePath, userDirectory, username);

      return actionResult(createDevAuthResponse(secret, userDirectory, username));
    } catch (error: unknown) {
      // No local failure maps to a catalog entry here; anything thrown becomes GenericError.
      return actionResultErrorFromCaughtError(error);
    }
  };
};

export const getUserDirectoryRefreshTokenActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askUserDirectoryRefreshToken, (qpqConfig) => getProcessRefreshToken(qpqConfig, devServerConfig));
