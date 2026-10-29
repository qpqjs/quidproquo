import { awsNamingUtils, qpqConfigAwsUtils } from '@qpqjs/config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askUserDirectoryGetUsersByAttribute,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  transientErrorMap,
} from '@qpqjs/core';

import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { listPagedUsersByAttribute } from '../../../logic/cognito/listPagedUsersByAttribute';

const getProcessGetUsersByAttribute = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryGetUsersByAttribute> => {
  return async ({ userDirectoryName, attribueName, attribueValue, limit, nextPageKey }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const userPoolId = await getExportedValue(awsNamingUtils.getCFExportNameUserPoolIdFromConfig(userDirectoryName, qpqConfig), region);

    try {
      const userAttributes = await listPagedUsersByAttribute(userPoolId, region, attribueName, attribueValue, limit, nextPageKey);

      return actionResult(userAttributes);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        ...transientErrorMap(),
        InvalidParameterException: () =>
          actionResultError(
            askUserDirectoryGetUsersByAttribute.errorType.InvalidSearchParameters,
            'The search attribute, value, limit, or page key is invalid',
          ),
        // Thrown by buildCognitoUserFilter before the Cognito call, for input
        // that cannot be embedded safely in a ListUsers filter string.
        INVALID_COGNITO_FILTER: () =>
          actionResultError(
            askUserDirectoryGetUsersByAttribute.errorType.InvalidSearchParameters,
            'The search attribute, value, limit, or page key is invalid',
          ),
        TooManyRequestsException: () =>
          actionResultError(askUserDirectoryGetUsersByAttribute.errorType.LimitExceeded, 'Too many requests, please try again later'),
      });
    }
  };
};

export const getUserDirectoryGetUsersByAttributeActionProcessor = createActionProcessor(
  askUserDirectoryGetUsersByAttribute,
  getProcessGetUsersByAttribute,
);
