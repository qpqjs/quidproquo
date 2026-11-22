import { actionResult, askUserDirectorySetDecodedAccessToken, createActionProcessor, ProcessorFor } from '@qpqjs/core';

const getProcessUserDirectorySetDecodedAccessToken = (): ProcessorFor<typeof askUserDirectorySetDecodedAccessToken> => {
  return async ({ decodedAccessToken }, session, actionProcessors, logger, updateSession) => {
    updateSession({ decodedAccessToken });

    return actionResult(undefined);
  };
};

export const getUserDirectorySetDecodedAccessTokenActionProcessor = createActionProcessor(
  askUserDirectorySetDecodedAccessToken,
  getProcessUserDirectorySetDecodedAccessToken,
);
