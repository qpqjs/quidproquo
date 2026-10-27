import { ConfigActionType, LogActionType, NetworkActionType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { CloudflareDnsDeployEvent, CloudflareDnsDeployEventEnum, CloudflareDnsEntry } from '../../../types';
import { askProcessCloudflareDnsDeployEvent, getDnsEntryName } from './askProcessCloudflareDnsDeployEvent';

const entry: CloudflareDnsEntry = { value: '1.2.3.4', type: 'A', proxied: false };

const recordsFor = (id: string | undefined) => ({
  status: 200,
  data: { result: id ? [{ id, type: 'A' }] : [], result_info: { total_pages: 1 } },
});

const runWithRecordedNetwork = (event: CloudflareDnsDeployEvent, existingRecordId?: string) => {
  const methods: string[] = [];

  runStory(askProcessCloudflareDnsDeployEvent(event), {
    [LogActionType.Create]: undefined,
    [ConfigActionType.GetSecret]: (action: any) => {
      expect(action.payload.secretName).toBe(event.apiSecretName);
      return 'api-key';
    },
    [NetworkActionType.Request]: (action: any) => {
      const { method, url } = action.payload;
      methods.push(method);

      if (method === 'GET' && url.includes('/zones?name=')) {
        return { status: 200, data: { result: [{ id: 'zone-1' }] } };
      }
      if (method === 'GET' && url.includes('/dns_records?name=')) {
        return recordsFor(existingRecordId);
      }
      return { status: 200, data: { success: true, errors: [] } };
    },
  });

  return methods;
};

describe('getDnsEntryName', () => {
  it('returns the dns entry name unchanged', () => {
    expect(getDnsEntryName('www.example.com', 'example.com')).toBe('www.example.com');
  });
});

describe('askProcessCloudflareDnsDeployEvent', () => {
  it('adds a record on a create event when none exists', () => {
    const event: CloudflareDnsDeployEvent = {
      RequestType: CloudflareDnsDeployEventEnum.Create,
      siteDns: 'example.com',
      apiSecretName: 'cf-secret',
      dnsEntries: { 'www.example.com': entry },
    };

    const methods = runWithRecordedNetwork(event);

    expect(methods).toEqual(['GET', 'GET', 'POST']);
  });

  it('replaces an existing record on a create event', () => {
    const event: CloudflareDnsDeployEvent = {
      RequestType: CloudflareDnsDeployEventEnum.Create,
      siteDns: 'example.com',
      apiSecretName: 'cf-secret',
      dnsEntries: { 'www.example.com': entry },
    };

    const methods = runWithRecordedNetwork(event, 'existing-rec');

    expect(methods).toEqual(['GET', 'GET', 'DELETE', 'POST']);
  });

  it('deletes the old records then adds the new ones on an update event', () => {
    const event: CloudflareDnsDeployEvent = {
      RequestType: CloudflareDnsDeployEventEnum.Update,
      siteDns: 'example.com',
      apiSecretName: 'cf-secret',
      dnsEntries: { 'www.example.com': entry },
      oldDnsEntries: { 'old.example.com': entry },
    };

    const methods = runWithRecordedNetwork(event, 'rec-1');

    expect(methods).toEqual(['GET', 'GET', 'DELETE', 'GET', 'DELETE', 'POST']);
  });

  it('only deletes records on a delete event', () => {
    const event: CloudflareDnsDeployEvent = {
      RequestType: CloudflareDnsDeployEventEnum.Delete,
      siteDns: 'example.com',
      apiSecretName: 'cf-secret',
      dnsEntries: { 'www.example.com': entry },
    };

    const methods = runWithRecordedNetwork(event, 'rec-1');

    expect(methods).toEqual(['GET', 'GET', 'DELETE']);
  });
});
