import {
  actionResult,
  askUserDirectoryAssociateSoftwareToken,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from '@qpqjs/core';

const getProcessAssociateSoftwareToken = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryAssociateSoftwareToken> => {
  return async ({ session }) => {
    // Static base32 secret ~ MFA codes are never actually verified in dev
    return actionResult({
      secretCode: 'DEVDEVDEVDEVDEVD',
      session,
    });
  };
};

export const getUserDirectoryAssociateSoftwareTokenActionProcessor = createActionProcessor(
  askUserDirectoryAssociateSoftwareToken,
  getProcessAssociateSoftwareToken,
);
