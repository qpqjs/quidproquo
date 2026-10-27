import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askUserDirectoryGetUserAttributesByUserId,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { resolveDevUserDirectory } from '../../../logic/auth/devAuth';
import { getDevUserByUserId } from '../../../logic/auth/jsonUserStore';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessGetUserAttributesByUserId = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askUserDirectoryGetUserAttributesByUserId> => {
  return async ({ userDirectoryName, userId }) => {
    try {
      const userDirectory = resolveDevUserDirectory(userDirectoryName, qpqConfig);
      const user = await getDevUserByUserId(devServerConfig.runtimePath, userDirectory, userId);

      if (!user) {
        return actionResultError(askUserDirectoryGetUserAttributesByUserId.errorType.UserNotFound, `User not found [${userId}]`);
      }

      return actionResult(user);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {});
    }
  };
};

export const getUserDirectoryGetUserAttributesByUserIdActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askUserDirectoryGetUserAttributesByUserId, (qpqConfig) => getProcessGetUserAttributesByUserId(qpqConfig, devServerConfig));
