import { getEventAutoRespondNoopActionProcessor as getEventAutoRespondActionProcessor } from '@qpqjs/actionprocessor-js';
import { getEventGetStorySessionNoopActionProcessor as getEventGetStorySessionActionProcessor } from '@qpqjs/actionprocessor-js';
import { EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

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

describe('cloudFrontOriginRequest getCloudFrontOriginRequestEventProcessor', () => {
  it('auto responds with null', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor, EventActionType.AutoRespond);

    expect(await processor({})).toEqual([null]);
  });
});
describe('cloudFrontOriginRequest getCloudFrontOriginRequestEventProcessor', () => {
  it('returns no story session', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession);

    expect(await processor({ qpqEventRecord: {}, eventParams: [] })).toEqual([null]);
  });
});
