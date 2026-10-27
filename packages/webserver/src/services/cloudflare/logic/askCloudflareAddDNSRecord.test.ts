import { ErrorTypeEnum, LogActionType, NetworkActionType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { CloudflareDnsEntry } from '../../../types';
import { askCloudflareAddDNSRecord } from './askCloudflareAddDNSRecord';

const dnsEntry: CloudflareDnsEntry = { value: '1.2.3.4', type: 'A', proxied: false };

describe('askCloudflareAddDNSRecord', () => {
  it('posts the DNS record with the entry details', () => {
    let captured: any;

    runStory(askCloudflareAddDNSRecord('key-123', 'zone-1', 'www.example.com', dnsEntry), {
      [LogActionType.Create]: undefined,
      [NetworkActionType.Request]: (action: any) => {
        captured = action;
        return { status: 200, data: { success: true, errors: [] } };
      },
    });

    expect(captured.payload).toEqual({
      url: 'https://api.cloudflare.com/client/v4/zones/zone-1/dns_records',
      method: 'POST',
      body: { type: 'A', name: 'www.example.com', content: '1.2.3.4', ttl: 1, proxied: false },
      headers: { Authorization: 'Bearer key-123', 'Content-Type': 'application/json' },
      basePath: undefined,
      params: undefined,
      responseType: 'json',
    });
  });

  it('coerces a string proxied value to a boolean', () => {
    let captured: any;

    runStory(askCloudflareAddDNSRecord('key', 'zone-1', 'www.example.com', { ...dnsEntry, proxied: 'true' as any }), {
      [LogActionType.Create]: undefined,
      [NetworkActionType.Request]: (action: any) => {
        captured = action;
        return { status: 200, data: { success: true, errors: [] } };
      },
    });

    expect(captured.payload.body.proxied).toBe(true);
  });

  it('throws a GenericError when the response is not 2xx', () => {
    expect(() =>
      runStory(askCloudflareAddDNSRecord('key', 'zone-1', 'www.example.com', dnsEntry), {
        [LogActionType.Create]: undefined,
        [NetworkActionType.Request]: { status: 500, data: { success: false, errors: [] } },
      }),
    ).toThrow(ErrorTypeEnum.GenericError);
  });

  it('throws a GenericError when the response reports failure', () => {
    expect(() =>
      runStory(askCloudflareAddDNSRecord('key', 'zone-1', 'www.example.com', dnsEntry), {
        [LogActionType.Create]: undefined,
        [NetworkActionType.Request]: { status: 200, data: { success: false, errors: [{ message: 'boom' }] } },
      }),
    ).toThrow('boom');
  });
});
