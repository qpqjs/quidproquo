import { ErrorTypeEnum, NetworkActionType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askCloudflareDeleteDNSRecord } from './askCloudflareDeleteDNSRecord';

describe('askCloudflareDeleteDNSRecord', () => {
  it('deletes the record by id', () => {
    let captured: any;

    runStory(askCloudflareDeleteDNSRecord('key-123', 'zone-1', 'rec-1'), {
      [NetworkActionType.Request]: (action: any) => {
        captured = action;
        return { status: 200, data: { success: true, errors: [] } };
      },
    });

    expect(captured.payload).toEqual({
      url: 'https://api.cloudflare.com/client/v4/zones/zone-1/dns_records/rec-1',
      method: 'DELETE',
      body: undefined,
      headers: { Authorization: 'Bearer key-123', 'Content-Type': 'application/json' },
      basePath: undefined,
      params: undefined,
      responseType: 'json',
    });
  });

  it('throws a GenericError when the response is not 2xx', () => {
    expect(() =>
      runStory(askCloudflareDeleteDNSRecord('key', 'zone-1', 'rec-1'), {
        [NetworkActionType.Request]: { status: 500, data: { success: false, errors: [] } },
      }),
    ).toThrow(ErrorTypeEnum.GenericError);
  });

  it('throws a GenericError when the response reports failure', () => {
    expect(() =>
      runStory(askCloudflareDeleteDNSRecord('key', 'zone-1', 'rec-1'), {
        [NetworkActionType.Request]: { status: 200, data: { success: false, errors: [] } },
      }),
    ).toThrow(ErrorTypeEnum.GenericError);
  });
});
