import {
  actionResult,
  actionResultErrorFromCaughtError,
  askUserDirectoryAuthenticateUserBase,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { createDevAuthResponse, resolveDevUserDirectory } from '../../../logic/auth/devAuth';
import { upsertDevUser } from '../../../logic/auth/jsonUserStore';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessAuthenticateUser = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askUserDirectoryAuthenticateUserBase> => {
  return async ({ userDirectoryName, authenticateUserRequest }) => {
    try {
      // Any username / password is accepted in dev ~ mint an unsigned JWT for whatever was typed in
      const userDirectory = resolveDevUserDirectory(userDirectoryName, qpqConfig);
      await upsertDevUser(devServerConfig.runtimePath, userDirectory, authenticateUserRequest.email);

      return actionResult(createDevAuthResponse(userDirectory, authenticateUserRequest.email));
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {});
    }
  };
};

export const getUserDirectoryAuthenticateUserActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askUserDirectoryAuthenticateUserBase, (qpqConfig) => getProcessAuthenticateUser(qpqConfig, devServerConfig));
