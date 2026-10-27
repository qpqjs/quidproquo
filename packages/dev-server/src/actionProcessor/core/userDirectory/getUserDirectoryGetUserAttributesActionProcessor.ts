import {
  actionResult,
  actionResultErrorFromCaughtError,
  askUserDirectoryGetUserAttributes,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { resolveDevUserDirectory } from '../../../logic/auth/devAuth';
import { upsertDevUser } from '../../../logic/auth/jsonUserStore';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessGetUserAttributes = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askUserDirectoryGetUserAttributes> => {
  return async ({ userDirectoryName, username }) => {
    try {
      // First access by email creates the user store entry
      const userDirectory = resolveDevUserDirectory(userDirectoryName, qpqConfig);

      return actionResult(await upsertDevUser(devServerConfig.runtimePath, userDirectory, username));
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {});
    }
  };
};

export const getUserDirectoryGetUserAttributesActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askUserDirectoryGetUserAttributes, (qpqConfig) => getProcessGetUserAttributes(qpqConfig, devServerConfig));
