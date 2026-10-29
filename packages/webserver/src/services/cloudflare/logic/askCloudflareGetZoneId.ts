import { askNetworkRequest, AskResponse, askThrowError, ErrorTypeEnum } from '@qpqjs/core';

import { CloudflareResponse, CloudflareZone } from '../types';

export function* askCloudflareGetZoneId(apiKey: string, siteDomainName: string): AskResponse<string> {
  const response = yield* askNetworkRequest<CloudflareResponse<CloudflareZone>, void>(
    'GET',
    `https://api.cloudflare.com/client/v4/zones?name=${siteDomainName}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `Error getting zoneId for [${siteDomainName}]`);
  }

  const zoneId = response.data.result[0]?.id;

  if (!zoneId) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `No zoneId found for [${siteDomainName}]`);
  }

  return zoneId;
}
