import { askConfigGetSecret, AskResponse } from 'quidproquo-core';

import { CloudflareDnsDeployEvent, CloudflareDnsDeployEventEnum, CloudflareDnsDeployEventResponse } from '../../../types';
import { askCloudflareAddDNSRecord } from './askCloudflareAddDNSRecord';
import { askCloudflareDeleteDNSRecord } from './askCloudflareDeleteDNSRecord';
import { askCloudflareGetDNSRecordId } from './askCloudflareGetDNSRecordId';
import { askCloudflareGetZoneId } from './askCloudflareGetZoneId';

export function getDnsEntryName(dnsEntryName: string, rootDomain: string) {
  // Apparently you don't need to do this...
  // if (dnsEntryName === rootDomain) {
  //   return '@';
  // }

  return dnsEntryName;
}

export function* askProcessCloudflareDnsDeployEvent(event: CloudflareDnsDeployEvent): AskResponse<CloudflareDnsDeployEventResponse> {
  const apiKey = yield* askConfigGetSecret(event.apiSecretName);

  // Get the site zone id
  const zoneId = yield* askCloudflareGetZoneId(apiKey, event.siteDns);

  // If its an update, delete the old DNS entries
  if (event.RequestType === CloudflareDnsDeployEventEnum.Update) {
    for (const oldDnsEntry of Object.keys(event.oldDnsEntries)) {
      const recordId = yield* askCloudflareGetDNSRecordId(apiKey, zoneId, getDnsEntryName(oldDnsEntry, event.siteDns));

      if (recordId) {
        yield* askCloudflareDeleteDNSRecord(apiKey, zoneId, recordId);
      }
    }
  }

  // If its a delete, delete the current DNS entries
  if (event.RequestType === CloudflareDnsDeployEventEnum.Delete) {
    for (const dnsEntry of Object.keys(event.dnsEntries)) {
      const recordId = yield* askCloudflareGetDNSRecordId(apiKey, zoneId, getDnsEntryName(dnsEntry, event.siteDns));

      if (recordId) {
        yield* askCloudflareDeleteDNSRecord(apiKey, zoneId, recordId);
      }
    }
  }

  // If its an update or create, add the new DNS entries
  if (event.RequestType === CloudflareDnsDeployEventEnum.Update || event.RequestType === CloudflareDnsDeployEventEnum.Create) {
    for (const dnsEntry of Object.keys(event.dnsEntries)) {
      const recordId = yield* askCloudflareGetDNSRecordId(apiKey, zoneId, getDnsEntryName(dnsEntry, event.siteDns));

      if (recordId) {
        yield* askCloudflareDeleteDNSRecord(apiKey, zoneId, recordId);
      }

      yield* askCloudflareAddDNSRecord(apiKey, zoneId, getDnsEntryName(dnsEntry, event.siteDns), event.dnsEntries[dnsEntry]);
    }
  }
}
