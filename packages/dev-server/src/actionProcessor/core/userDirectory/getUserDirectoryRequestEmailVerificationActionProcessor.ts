import {
  actionResult,
  askUserDirectoryRequestEmailVerification,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';
import { qpqWebServerUtils } from 'quidproquo-webserver';

import { resolveDevUsername } from '../../../logic/auth/devAuth';

const getProcessRequestEmailVerification = (_qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryRequestEmailVerification> => {
  return async ({ accessToken }) => {
    // No email is actually sent in dev
    const decoded = qpqWebServerUtils.unsafeDecodeJWTPayload<{ email?: string; username?: string; sub?: string }>(accessToken);

    return actionResult({
      attributeName: 'email',
      deliveryMedium: 'EMAIL',
      destination: resolveDevUsername(decoded?.email || decoded?.username || decoded?.sub),
    });
  };
};

export const getUserDirectoryRequestEmailVerificationActionProcessor = createActionProcessor(
  askUserDirectoryRequestEmailVerification,
  getProcessRequestEmailVerification,
);
