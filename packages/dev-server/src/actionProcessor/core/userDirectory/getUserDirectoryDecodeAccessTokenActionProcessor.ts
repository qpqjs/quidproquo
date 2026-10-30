import {
  actionResult,
  actionResultError,
  askUserDirectoryDecodeAccessToken,
  createActionProcessor,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
} from '@qpqjs/core';

import { decodeAccessTokenForDev } from '../../../logic/auth/decodeAccessTokenForDev';
import { resolveDevUserDirectory } from '../../../logic/auth/devAuth';
import { getOrSeedDevJwtSecret } from '../../../logic/auth/devJwtSecret';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessDecodeAccessToken = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askUserDirectoryDecodeAccessToken> => {
  return async ({ userDirectoryName, accessToken, ignoreExpiration }) => {
    const secret = await getOrSeedDevJwtSecret(devServerConfig.runtimePath, resolveDevUserDirectory(userDirectoryName, qpqConfig));
    const decodedAccessToken = decodeAccessTokenForDev(secret, userDirectoryName, accessToken, ignoreExpiration);

    if (!decodedAccessToken) {
      return actionResultError(ErrorTypeEnum.Unauthorized, 'Invalid access token');
    }

    return actionResult(decodedAccessToken);
  };
};

export const getUserDirectoryDecodeAccessTokenActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askUserDirectoryDecodeAccessToken, (qpqConfig) => getProcessDecodeAccessToken(qpqConfig, devServerConfig));
