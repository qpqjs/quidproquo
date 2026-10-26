import {
  actionResult,
  actionResultError,
  askUserDirectoryReadAccessToken,
  createActionProcessor,
  ErrorTypeEnum,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { decodeAccessToken } from '../../../logic/cognito/decodeAccessToken';

const getProcessReadAccessToken = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryReadAccessToken> => {
  return async ({ userDirectoryName, ignoreExpiration }, { decodedAccessToken, accessToken }) => {
    if (decodedAccessToken) {
      const nowInSeconds = Math.floor(Date.now() / 1000);

      // A route without token auth still records an UNVERIFIED decode of any bearer header on the
      // session, for the logs. wasValid false on a token that has not expired is that case: the
      // signature was never checked, so it is nobody's identity.
      if (!decodedAccessToken.wasValid && decodedAccessToken.exp >= nowInSeconds) {
        return actionResultError(ErrorTypeEnum.Unauthorized, 'Access token was not verified');
      }

      if (!ignoreExpiration && decodedAccessToken.exp < nowInSeconds) {
        return actionResultError(ErrorTypeEnum.Invalid, 'Access has expired');
      }

      return actionResult(decodedAccessToken);
    }

    // decodeAccessToken throws on a missing/unverifiable token; surface that as
    // a typed Unauthorized result (matching the SetAccessToken processor)
    // instead of letting the raw error escape as a GenericError.
    try {
      return actionResult(await decodeAccessToken(userDirectoryName, qpqConfig, accessToken, ignoreExpiration));
    } catch {
      return actionResultError(ErrorTypeEnum.Unauthorized, 'Invalid accessToken');
    }
  };
};

export const getUserDirectoryReadAccessTokenActionProcessor = createActionProcessor(askUserDirectoryReadAccessToken, getProcessReadAccessToken);
