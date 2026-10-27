import {
  actionResult,
  askUserDirectoryForgotPassword,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { resolveDevUsername } from '../../../logic/auth/devAuth';

const getProcessForgotPassword = (_qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryForgotPassword> => {
  return async ({ username }) => {
    // No email is actually sent in dev
    return actionResult({
      attributeName: 'email',
      deliveryMedium: 'EMAIL',
      destination: resolveDevUsername(username),
    });
  };
};

export const getUserDirectoryForgotPasswordActionProcessor = createActionProcessor(askUserDirectoryForgotPassword, getProcessForgotPassword);
