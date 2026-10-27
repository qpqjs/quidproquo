import {
  actionResult,
  actionResultErrorFromCaughtError,
  askUserDirectoryRespondToAuthChallenge,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { createDevAuthResponse, resolveDevUserDirectory } from '../../../logic/auth/devAuth';
import { upsertDevUser } from '../../../logic/auth/jsonUserStore';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessRespondToAuthChallenge = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askUserDirectoryRespondToAuthChallenge> => {
  return async ({ userDirectoryName, authChallenge }) => {
    try {
      // Dev auth never issues challenges, but if one is answered, it always passes
      const userDirectory = resolveDevUserDirectory(userDirectoryName, qpqConfig);
      await upsertDevUser(devServerConfig.runtimePath, userDirectory, authChallenge.username);

      return actionResult(createDevAuthResponse(userDirectory, authChallenge.username));
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {});
    }
  };
};

export const getUserDirectoryRespondToAuthChallengeActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askUserDirectoryRespondToAuthChallenge, (qpqConfig) => getProcessRespondToAuthChallenge(qpqConfig, devServerConfig));
