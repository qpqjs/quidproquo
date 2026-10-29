import { qpqConfigAwsUtils } from '@qpqjs/config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askUserDirectoryForgotPassword,
  AuthenticationDeliveryDetails,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
} from '@qpqjs/core';

import { getCFExportNameUserPoolClientIdFromConfig, getCFExportNameUserPoolIdFromConfig } from '../../../awsNamingUtils';
import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { forgotPassword } from '../../../logic/cognito/forgotPassword';
import { resolveUsernameByPreferredUsername } from '../../../logic/cognito/resolveUsernameByPreferredUsername';
import { maskDeliveryDestination } from '../../../logic/cognito/utils/maskDeliveryDestination';

const getProcessForgotPassword = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryForgotPassword> => {
  return async ({ username, userDirectoryName }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const userPoolId = await getExportedValue(getCFExportNameUserPoolIdFromConfig(userDirectoryName, qpqConfig), region);

    const userPoolClientId = await getExportedValue(getCFExportNameUserPoolClientIdFromConfig(userDirectoryName, qpqConfig), region);

    const resolvedUsername = await resolveUsernameByPreferredUsername(userPoolId, region, username);

    try {
      const authResponse: AuthenticationDeliveryDetails = await forgotPassword(userPoolId, userPoolClientId, region, resolvedUsername);

      return actionResult(authResponse);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        // An unknown account must look like a known one (the pool client prevents existence errors; this
        // covers the exception if it still arrives), so the caller cannot enumerate emails.
        UserNotFoundException: () =>
          actionResult<AuthenticationDeliveryDetails>({
            attributeName: 'email',
            deliveryMedium: 'EMAIL',
            destination: maskDeliveryDestination(username),
          }),
        LimitExceededException: () =>
          actionResultError(askUserDirectoryForgotPassword.errorType.LimitExceeded, 'Too many attempts, please try again later'),
      });
    }
  };
};

export const getUserDirectoryForgotPasswordActionProcessor = createActionProcessor(askUserDirectoryForgotPassword, getProcessForgotPassword);
