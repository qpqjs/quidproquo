import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  askUserDirectoryDecodeAccessToken,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { getCFExportNameUserPoolIdFromConfig } from '../../../awsNamingUtils';
import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { decodeValidJwt } from '../../../logic/cognito/decodeValidJwt';

const getProcessDecodeAccessToken = (qpqConfig: QPQConfig): ProcessorFor<typeof askUserDirectoryDecodeAccessToken> => {
  return async ({ userDirectoryName, accessToken, ignoreExpiration }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const userPoolId = await getExportedValue(getCFExportNameUserPoolIdFromConfig(userDirectoryName, qpqConfig), region);

    const authInfo = await decodeValidJwt(userPoolId, region, ignoreExpiration, accessToken);

    if (!authInfo || !authInfo?.username) {
      return actionResultError(askUserDirectoryDecodeAccessToken.errorType.Unauthorized, 'Invalid access token');
    }

    return actionResult({
      ...authInfo,

      userDirectory: userDirectoryName,
    });
  };
};

export const getUserDirectoryDecodeAccessTokenActionProcessor = createActionProcessor(askUserDirectoryDecodeAccessToken, getProcessDecodeAccessToken);
