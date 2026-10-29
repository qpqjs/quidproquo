import {
  actionResult,
  actionResultErrorFromCaughtError,
  askUserDirectoryAuthenticateUserBase,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
} from '@qpqjs/core';

import { createDevAuthResponse, resolveDevUserDirectory } from '../../../logic/auth/devAuth';
import { getOrSeedDevJwtSecret } from '../../../logic/auth/devJwtSecret';
import { upsertDevUser } from '../../../logic/auth/jsonUserStore';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessAuthenticateUser = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askUserDirectoryAuthenticateUserBase> => {
  return async ({ userDirectoryName, authenticateUserRequest }) => {
    try {
      // Any username / password is accepted in dev: mint a locally signed JWT for whatever was typed in
      const userDirectory = resolveDevUserDirectory(userDirectoryName, qpqConfig);
      await upsertDevUser(devServerConfig.runtimePath, userDirectory, authenticateUserRequest.email);
      const secret = await getOrSeedDevJwtSecret(devServerConfig.runtimePath, userDirectory);

      return actionResult(createDevAuthResponse(secret, userDirectory, authenticateUserRequest.email));
    } catch (error: unknown) {
      // No local failure maps to a catalog entry here; anything thrown becomes GenericError.
      return actionResultErrorFromCaughtError(error);
    }
  };
};

export const getUserDirectoryAuthenticateUserActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askUserDirectoryAuthenticateUserBase, (qpqConfig) => getProcessAuthenticateUser(qpqConfig, devServerConfig));
