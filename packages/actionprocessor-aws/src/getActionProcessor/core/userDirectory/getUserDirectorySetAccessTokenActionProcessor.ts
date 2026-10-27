import {
  actionResult,
  actionResultError,
  askUserDirectorySetAccessToken,
  createActionProcessor,
  DecodedAccessToken,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { decodeAccessToken } from '../../../logic/cognito';

const getProcessSetAccessToken = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectorySetAccessToken> => {
  return async ({ accessToken, userDirectoryName }, session, apl, logger, updateSession) => {
    // decodeAccessToken throws on a missing/unverifiable/expired token; surface that
    // as a typed Unauthorized result (matching the dev-server processor and
    // ReadAccessToken) instead of letting the raw error escape as a GenericError.
    // The session is left untouched on failure.
    let decodedAccessToken: DecodedAccessToken;
    try {
      decodedAccessToken = await decodeAccessToken(userDirectoryName, qpqConfig, accessToken, false);
    } catch {
      return actionResultError(ErrorTypeEnum.Unauthorized, 'Invalid accessToken');
    }

    updateSession({
      decodedAccessToken: decodedAccessToken,
      accessToken,
    });

    return actionResult(decodedAccessToken);
  };
};

export const getUserDirectorySetAccessTokenActionProcessor = createActionProcessor(askUserDirectorySetAccessToken, getProcessSetAccessToken);
