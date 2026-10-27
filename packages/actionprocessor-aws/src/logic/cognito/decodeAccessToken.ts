import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { DecodedAccessToken, QPQConfig } from 'quidproquo-core';

import { getCFExportNameUserPoolIdFromConfig } from '../../awsNamingUtils';
import { getExportedValue } from '../cloudformation/getExportedValue';
import { decodeValidJwt } from './decodeValidJwt';

// decodeValidJwt returns null rather than throwing, so this throw is the
// discriminable signal callers (e.g. the SetAccessToken processor) catch to
// produce an Unauthorized result.
export class InvalidAccessTokenError extends Error {
  readonly code = 'INVALID_ACCESS_TOKEN';

  constructor() {
    super('Unable to decode access token');
    this.name = 'InvalidAccessTokenError';
  }
}

/**
 * Decodes and verifies a Cognito access token for the given user directory,
 * resolving the pool id from the directory's CloudFormation export. Throws
 * InvalidAccessTokenError when the token is missing or fails verification.
 * With ignoreExpiration, an expired but otherwise valid token is returned with
 * wasValid false.
 */
export const decodeAccessToken = async (
  userDirectoryName: string,
  qpqConfig: QPQConfig,
  accessToken?: string,
  ignoreExpiration: boolean = false,
): Promise<DecodedAccessToken> => {
  const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);
  const userPoolId = await getExportedValue(getCFExportNameUserPoolIdFromConfig(userDirectoryName, qpqConfig), region);

  const decodedAuthToken = await decodeValidJwt(userPoolId, region, ignoreExpiration, accessToken);

  if (!decodedAuthToken?.username) {
    throw new InvalidAccessTokenError();
  }

  // decodeValidJwt only enforces expiry when ignoreExpiration is false, so
  // recheck here to report whether an ignored-expiry token was actually valid.
  const wasValid = !ignoreExpiration || decodedAuthToken.exp > Math.floor(Date.now() / 1000);

  return {
    ...decodedAuthToken,

    wasValid,
    userDirectory: userDirectoryName,
  };
};
