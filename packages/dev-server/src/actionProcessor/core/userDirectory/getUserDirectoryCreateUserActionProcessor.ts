import {
  actionResult,
  actionResultErrorFromCaughtError,
  askUserDirectoryCreateUser,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
} from '@qpqjs/core';

import { createDevAuthResponse, resolveDevUserDirectory } from '../../../logic/auth/devAuth';
import { getOrSeedDevJwtSecret } from '../../../logic/auth/devJwtSecret';
import { upsertDevUser } from '../../../logic/auth/jsonUserStore';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessCreateUser = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig): ProcessorFor<typeof askUserDirectoryCreateUser> => {
  return async ({ userDirectoryName, createUserRequest }) => {
    try {
      // Signup just logs you straight in ~ store everything but the password
      const { password, ...userAttributes } = createUserRequest;
      const userDirectory = resolveDevUserDirectory(userDirectoryName, qpqConfig);
      await upsertDevUser(devServerConfig.runtimePath, userDirectory, createUserRequest.email, userAttributes);

      const secret = await getOrSeedDevJwtSecret(devServerConfig.runtimePath, userDirectory);

      return actionResult(createDevAuthResponse(secret, userDirectory, createUserRequest.email));
    } catch (error: unknown) {
      // No local failure maps to a catalog entry here; anything thrown becomes GenericError.
      return actionResultErrorFromCaughtError(error);
    }
  };
};

export const getUserDirectoryCreateUserActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askUserDirectoryCreateUser, (qpqConfig) => getProcessCreateUser(qpqConfig, devServerConfig));
