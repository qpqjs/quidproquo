import { ErrorTypeEnum, NetworkActionType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { askCloudflareGetZoneId } from './askCloudflareGetZoneId';

describe('askCloudflareGetZoneId', () => {
  it('requests the zone by name and returns the first zone id', () => {
    let captured: any;

    const result = runStory(askCloudflareGetZoneId('key-123', 'example.com'), {
      [NetworkActionType.Request]: (action: any) => {
        captured = action;
        return { status: 200, data: { result: [{ id: 'zone-1' }] } };
      },
    });

    expect(result).toBe('zone-1');
    expect(captured.payload).toEqual({
      url: 'https://api.cloudflare.com/client/v4/zones?name=example.com',
      method: 'GET',
      body: undefined,
      headers: { Authorization: 'Bearer key-123', 'Content-Type': 'application/json' },
      basePath: undefined,
      params: undefined,
      responseType: 'json',
    });
  });

  it('throws a GenericError when the response is not 2xx', () => {
    expect(() =>
      runStory(askCloudflareGetZoneId('key', 'example.com'), {
        [NetworkActionType.Request]: { status: 500, data: { result: [] } },
      }),
    ).toThrow(ErrorTypeEnum.GenericError);
  });

  it('throws a GenericError when no zone is returned', () => {
    expect(() =>
      runStory(askCloudflareGetZoneId('key', 'example.com'), {
        [NetworkActionType.Request]: { status: 200, data: { result: [] } },
      }),
    ).toThrow(ErrorTypeEnum.GenericError);
  });
});
