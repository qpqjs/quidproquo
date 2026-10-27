import { askNetworkRequest, AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { CloudflareResponse } from '../types';

export function* askCloudflareDeleteDNSRecord(apiKey: string, zoneId: string, recordId: string): AskResponse<void> {
  const response = yield* askNetworkRequest<void, CloudflareResponse<void>>(
    'DELETE',
    `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${recordId}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (response.status < 200 || response.status >= 300 || !response.data.success) {
    yield* askThrowError(ErrorTypeEnum.GenericError, `Failed to delete DNS record: ${response.data.errors.join(', ')}`);
  }
}
