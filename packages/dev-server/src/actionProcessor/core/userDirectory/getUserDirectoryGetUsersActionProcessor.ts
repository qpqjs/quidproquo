import {
  actionResult,
  actionResultErrorFromCaughtError,
  askUserDirectoryGetUsers,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
} from '@qpqjs/core';

import { resolveDevUserDirectory } from '../../../logic/auth/devAuth';
import { listDevUsers } from '../../../logic/auth/jsonUserStore';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessGetUsers = (qpqConfig: QPQConfig, devServerConfig: ResolvedDevServerConfig): ProcessorFor<typeof askUserDirectoryGetUsers> => {
  return async ({ userDirectoryName }) => {
    try {
      const userDirectory = resolveDevUserDirectory(userDirectoryName, qpqConfig);

      return actionResult({
        items: await listDevUsers(devServerConfig.runtimePath, userDirectory),
      });
    } catch (error: unknown) {
      // No local failure maps to a catalog entry here; anything thrown becomes GenericError.
      return actionResultErrorFromCaughtError(error);
    }
  };
};

export const getUserDirectoryGetUsersActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askUserDirectoryGetUsers, (qpqConfig) => getProcessGetUsers(qpqConfig, devServerConfig));
