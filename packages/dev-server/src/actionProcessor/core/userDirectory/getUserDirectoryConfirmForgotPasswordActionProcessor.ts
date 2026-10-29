import {
  actionResult,
  actionResultErrorFromCaughtError,
  askUserDirectoryConfirmForgotPassword,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
} from '@qpqjs/core';

import { createDevAuthResponse, resolveDevUserDirectory } from '../../../logic/auth/devAuth';
import { upsertDevUser } from '../../../logic/auth/jsonUserStore';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessConfirmForgotPassword = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askUserDirectoryConfirmForgotPassword> => {
  return async ({ userDirectoryName, username }) => {
    try {
      // Any confirmation code is accepted in dev
      const userDirectory = resolveDevUserDirectory(userDirectoryName, qpqConfig);
      await upsertDevUser(devServerConfig.runtimePath, userDirectory, username);

      return actionResult(createDevAuthResponse(userDirectory, username));
    } catch (error: unknown) {
      // No local failure maps to a catalog entry here; anything thrown becomes GenericError.
      return actionResultErrorFromCaughtError(error);
    }
  };
};

export const getUserDirectoryConfirmForgotPasswordActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askUserDirectoryConfirmForgotPassword, (qpqConfig) => getProcessConfirmForgotPassword(qpqConfig, devServerConfig));
