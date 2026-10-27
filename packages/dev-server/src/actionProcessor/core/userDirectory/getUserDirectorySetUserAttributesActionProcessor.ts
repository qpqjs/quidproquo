import {
  actionResult,
  actionResultErrorFromCaughtError,
  askUserDirectorySetUserAttributes,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { resolveDevUserDirectory } from '../../../logic/auth/devAuth';
import { upsertDevUser } from '../../../logic/auth/jsonUserStore';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessSetUserAttributes = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askUserDirectorySetUserAttributes> => {
  return async ({ userDirectoryName, username, userAttributes }) => {
    try {
      const userDirectory = resolveDevUserDirectory(userDirectoryName, qpqConfig);
      await upsertDevUser(devServerConfig.runtimePath, userDirectory, username, userAttributes);

      return actionResult(void 0);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {});
    }
  };
};

export const getUserDirectorySetUserAttributesActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askUserDirectorySetUserAttributes, (qpqConfig) => getProcessSetUserAttributes(qpqConfig, devServerConfig));
