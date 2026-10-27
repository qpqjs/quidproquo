import {
  actionResult,
  actionResultError,
  askUserDirectoryDecodeAccessToken,
  createActionProcessor,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { decodeAccessTokenForDev } from '../../../logic/auth/decodeAccessTokenForDev';

const getProcessDecodeAccessToken = (_qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryDecodeAccessToken> => {
  return async ({ userDirectoryName, accessToken, ignoreExpiration }) => {
    const decodedAccessToken = decodeAccessTokenForDev(userDirectoryName, accessToken, ignoreExpiration);

    if (!decodedAccessToken) {
      return actionResultError(ErrorTypeEnum.Unauthorized, 'Invalid access token');
    }

    return actionResult(decodedAccessToken);
  };
};

export const getUserDirectoryDecodeAccessTokenActionProcessor = createActionProcessor(askUserDirectoryDecodeAccessToken, getProcessDecodeAccessToken);
