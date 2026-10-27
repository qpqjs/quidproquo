import {
  actionResult,
  actionResultErrorFromCaughtError,
  askUserDirectoryGetUsersByAttribute,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { resolveDevUserDirectory } from '../../../logic/auth/devAuth';
import { findDevUsersByAttribute } from '../../../logic/auth/jsonUserStore';
import { ResolvedDevServerConfig } from '../../../types';

const getProcessGetUsersByAttribute = (
  qpqConfig: QPQConfig,
  devServerConfig: ResolvedDevServerConfig,
): ProcessorFor<typeof askUserDirectoryGetUsersByAttribute> => {
  return async ({ userDirectoryName, attribueName, attribueValue, limit }) => {
    try {
      const userDirectory = resolveDevUserDirectory(userDirectoryName, qpqConfig);
      const users = await findDevUsersByAttribute(devServerConfig.runtimePath, userDirectory, attribueName, attribueValue);

      return actionResult({
        items: limit ? users.slice(0, limit) : users,
      });
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {});
    }
  };
};

export const getUserDirectoryGetUsersByAttributeActionProcessor = (devServerConfig: ResolvedDevServerConfig) =>
  createActionProcessor(askUserDirectoryGetUsersByAttribute, (qpqConfig) => getProcessGetUsersByAttribute(qpqConfig, devServerConfig));
