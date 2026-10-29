import { askLogCreate, askNetworkRequest, AskResponse, askThrowError, ErrorTypeEnum, LogLevelEnum } from '@qpqjs/core';

import { CloudflareDnsEntry } from '../../../types';
import { CloudflareDNSRecord, CloudflareResponse } from '../types';

export function* askCloudflareAddDNSRecord(apiKey: string, zoneId: string, cnameName: string, dnsEntryValue: CloudflareDnsEntry): AskResponse<void> {
  const requestBody = {
    type: dnsEntryValue.type, // Use the type from the dnsEntryValue
    name: cnameName,
    content: dnsEntryValue.value,
    ttl: 1, // Automatic TTL
    proxied: typeof dnsEntryValue.proxied === 'string' ? (dnsEntryValue.proxied as string).toLowerCase() === 'true' : Boolean(dnsEntryValue.proxied),
  };

  yield* askLogCreate(LogLevelEnum.Info, `type of proxied: [${typeof dnsEntryValue.proxied}]`);

  const response = yield* askNetworkRequest<
    CloudflareResponse<CloudflareDNSRecord>,
    {
      type: 'CNAME' | 'A';
      name: string;
      content: string;
      ttl: number;
      proxied: boolean;
    }
  >('POST', `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: requestBody,
  });

  if (response.status < 200 || response.status >= 300) {
    yield* askThrowError(ErrorTypeEnum.GenericError, `Error adding DNS records`);
  }

  if (!response.data.success) {
    yield* askThrowError(ErrorTypeEnum.GenericError, `Failed to add CNAME record: ${response.data.errors.map((e) => e.message).join(', ')}`);
  }
}
