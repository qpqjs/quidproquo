import {
  actionResult,
  actionResultError,
  askUserDirectorySetAccessToken,
  createActionProcessor,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
} from '@qpqjs/core';

import { decodeAccessTokenForDev } from '../../../logic/auth/decodeAccessTokenForDev';
import { resolveDevUserDirectory } from '../../../logic/auth/devAuth';
import { getOrSeedDevJwtSecret } from '../../../logic/auth/devJwtSecret';
import { ensureDevUserFromAccessToken } from '../../../logic/auth/ensureDevUserFromAccessToken';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessSetAccessToken = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askUserDirectorySetAccessToken> => {
  return async ({ accessToken, userDirectoryName }, session, apl, logger, updateSession) => {
    const userDirectory = resolveDevUserDirectory(userDirectoryName, qpqConfig);
    const secret = await getOrSeedDevJwtSecret(devServerConfig.runtimePath, userDirectory);
    const decodedAccessToken = decodeAccessTokenForDev(secret, userDirectoryName, accessToken, false);

    if (!decodedAccessToken) {
      return actionResultError(ErrorTypeEnum.Unauthorized, 'Invalid accessToken');
    }

    // Best effort: a token is accepted on its own; a store that cannot be reached only
    // costs the roster its display names, and the next login rewrites it anyway.
    try {
      await ensureDevUserFromAccessToken(devServerConfig.runtimePath, userDirectory, accessToken);
    } catch (error: unknown) {
      console.warn(`[dev-server] could not self-heal the user store from the access token: ${String(error)}`);
    }

    updateSession({
      decodedAccessToken,
      accessToken,
    });

    return actionResult(decodedAccessToken);
  };
};

export const getUserDirectorySetAccessTokenActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askUserDirectorySetAccessToken, (qpqConfig) => getProcessSetAccessToken(qpqConfig, devServerConfig));
