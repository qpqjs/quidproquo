import { askNetworkRequest, AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { CloudflareDNSRecord, CloudflareResponse } from '../types';

export function* askCloudflareGetDNSRecordId(apiKey: string, zoneId: string, cnameName: string): AskResponse<string | undefined> {
  let page = 1;
  let total_pages = 0;
  let allRecords: CloudflareDNSRecord[] = [];

  do {
    const response = yield* askNetworkRequest<void, CloudflareResponse<CloudflareDNSRecord>>(
      'GET',
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${cnameName}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (response.status < 200 || response.status >= 300) {
      yield* askThrowError(ErrorTypeEnum.GenericError, `Error getting DNS record for [${cnameName}]`);
    }

    // Filter out all the non-CNAME and non-A records from the combined results
    const filteredRecords = response.data.result.filter((record) => record.type === 'CNAME' || record.type === 'A');

    allRecords = [...allRecords, ...filteredRecords];
    total_pages = response.data.result_info.total_pages;
    page += 1;
  } while (page <= total_pages);

  return allRecords[0]?.id;
}
