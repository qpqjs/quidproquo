import {
  actionResult,
  actionResultErrorFromCaughtError,
  askUserDirectoryRefreshToken,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import { createDevAuthResponse, resolveDevUserDirectory } from '../../../logic/auth/devAuth';
import { getDevUserByUserId, upsertDevUser } from '../../../logic/auth/jsonUserStore';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessRefreshToken = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askUserDirectoryRefreshToken> => {
  return async ({ userDirectoryName, refreshToken }) => {
    try {
      // Keep the same user the refresh token was minted for, falling back to the dev user
      const userDirectory = resolveDevUserDirectory(userDirectoryName, qpqConfig);
      const decoded = qpqWebServerUtils.unsafeDecodeJWTPayload<{ username?: string; email?: string; sub?: string }>(refreshToken);

      // A token carrying only a sub (userId) resolves back to its email through the user store
      let username = decoded?.username || decoded?.email;
      if (!username && decoded?.sub) {
        username = (await getDevUserByUserId(devServerConfig.runtimePath, userDirectory, decoded.sub))?.email;
      }

      await upsertDevUser(devServerConfig.runtimePath, userDirectory, username);

      return actionResult(createDevAuthResponse(userDirectory, username));
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {});
    }
  };
};

export const getUserDirectoryRefreshTokenActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askUserDirectoryRefreshToken, (qpqConfig) => getProcessRefreshToken(qpqConfig, devServerConfig));
