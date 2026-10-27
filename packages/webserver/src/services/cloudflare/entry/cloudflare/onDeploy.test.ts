import { ConfigActionType, LogActionType, NetworkActionType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { CloudflareDnsDeployEvent, CloudflareDnsDeployEventEnum } from '../../../../types';
import { onDeploy } from './onDeploy';

describe('cloudflare onDeploy', () => {
  it('delegates the deploy event to the cloudflare dns processor', () => {
    const event: CloudflareDnsDeployEvent = {
      RequestType: CloudflareDnsDeployEventEnum.Create,
      siteDns: 'example.com',
      apiSecretName: 'cf-secret',
      dnsEntries: { 'www.example.com': { value: '1.2.3.4', type: 'A', proxied: false } },
    };

    const methods: string[] = [];

    runStory(onDeploy(event), {
      [LogActionType.Create]: undefined,
      [ConfigActionType.GetSecret]: 'api-key',
      [NetworkActionType.Request]: (action: any) => {
        const { method, url } = action.payload;
        methods.push(method);

        if (method === 'GET' && url.includes('/zones?name=')) {
          return { status: 200, data: { result: [{ id: 'zone-1' }] } };
        }
        if (method === 'GET' && url.includes('/dns_records?name=')) {
          return { status: 200, data: { result: [], result_info: { total_pages: 1 } } };
        }
        return { status: 200, data: { success: true, errors: [] } };
      },
    });

    expect(methods).toEqual(['GET', 'GET', 'POST']);
  });
});
