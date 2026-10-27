import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askUserDirectoryGetUserAttributes,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { getCFExportNameUserPoolIdFromConfig } from '../../../awsNamingUtils';
import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { getUserAttributes } from '../../../logic/cognito/getUserAttributes';
import { resolveUsernameByPreferredUsername } from '../../../logic/cognito/resolveUsernameByPreferredUsername';

const getProcessGetUserAttributes = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryGetUserAttributes> => {
  return async ({ userDirectoryName, username }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const userPoolId = await getExportedValue(getCFExportNameUserPoolIdFromConfig(userDirectoryName, qpqConfig), region);

    try {
      const resolvedUsername = await resolveUsernameByPreferredUsername(userPoolId, region, username);

      const userAttributes = await getUserAttributes(userPoolId, region, resolvedUsername);

      return actionResult(userAttributes);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        UserNotFoundException: () => actionResultError(askUserDirectoryGetUserAttributes.errorType.UserNotFound, 'User not found'),
      });
    }
  };
};

export const getUserDirectoryGetUserAttributesActionProcessor = createActionProcessor(askUserDirectoryGetUserAttributes, getProcessGetUserAttributes);
