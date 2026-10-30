import { EventActionType } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';
import { defineDns } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';

const buildCloudFrontRequest = (uri: string): any => ({
  cf: {
    request: {
      uri,
      method: 'GET',
      clientIp: '9.9.9.9',
      body: undefined,
      headers: { host: [{ value: 'example.com' }] },
    },
  },
});

const context = { awsRequestId: 'req-1' } as any;

describe('cloudFrontOriginRequest getEventGetRecordsActionProcessor', () => {
  it('maps each cloudfront request record to an internal seo record', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);

    const [records] = await processor({ eventParams: [{ Records: [buildCloudFrontRequest('/page')] }, context] });

    expect((records as any[])[0]).toEqual({
      domain: expect.any(String),
      body: undefined,
      correlation: 'req-1',
      method: 'GET',
      path: '/page',
      sourceIp: '9.9.9.9',
      headers: { host: 'example.com' },
      query: {},
    });
  });
});
describe('cloudFrontOriginRequest getEventGetRecordsActionProcessor host handling', () => {
  it('never takes the domain from an unknown Host or an X-Forwarded-Host header', async () => {
    const config = buildTestQpqConfig([defineDns('example.com')]);
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords, config);
    const request = buildCloudFrontRequest('/page');
    request.cf.request.headers = { host: [{ value: 'evil.example' }], 'x-forwarded-host': [{ value: 'evil.example' }] };

    const [records] = await processor({ eventParams: [{ Records: [request] }, context] });

    const domain = (records as any[])[0].domain as string;
    expect(domain).not.toContain('evil.example');
    expect(domain.endsWith('example.com')).toBe(true);
  });
});
