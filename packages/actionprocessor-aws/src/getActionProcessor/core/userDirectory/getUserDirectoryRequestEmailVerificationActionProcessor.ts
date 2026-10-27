import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askUserDirectoryRequestEmailVerification,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { requestEmailVerificationCode } from '../../../logic/cognito/requestEmailVerificationCode';

const getProcessRequestEmailVerification = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryRequestEmailVerification> => {
  return async ({ userDirectoryName, accessToken }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      const deliveryDetails = await requestEmailVerificationCode(region, accessToken);

      return actionResult(deliveryDetails);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        NotAuthorizedException: () =>
          actionResultError(askUserDirectoryRequestEmailVerification.errorType.Unauthorized, 'Access token is invalid or has expired'),
        LimitExceededException: () =>
          actionResultError(askUserDirectoryRequestEmailVerification.errorType.LimitExceeded, 'Too many attempts, please try again later'),
        CodeDeliveryFailureException: () =>
          actionResultError(askUserDirectoryRequestEmailVerification.errorType.CodeDeliveryFailed, 'Could not deliver the verification code'),
      });
    }
  };
};

export const getUserDirectoryRequestEmailVerificationActionProcessor = createActionProcessor(
  askUserDirectoryRequestEmailVerification,
  getProcessRequestEmailVerification,
);
