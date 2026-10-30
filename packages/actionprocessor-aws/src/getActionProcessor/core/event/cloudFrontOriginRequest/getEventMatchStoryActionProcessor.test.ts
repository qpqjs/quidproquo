import { ErrorTypeEnum, EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';
import { defineSeo } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';

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

describe('cloudFrontOriginRequest getEventMatchStoryActionProcessor', () => {
  it('returns a NotFound error when no seo config matches', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory);

    const [, error] = await processor({ qpqEventRecord: { path: '/missing' } });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('matches the request path to a configured seo entry', async () => {
    const runtime: QpqFunctionRuntime = '/entry/seo::seo';
    const config = buildTestQpqConfig([defineSeo('/page', runtime)]);
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory, config);

    const [match] = await processor({ qpqEventRecord: { path: '/page' } });

    expect((match as any).runtime).toEqual(runtime);
  });

  it('decodes seo path params', async () => {
    const runtime: QpqFunctionRuntime = '/entry/seo::seo';
    const config = buildTestQpqConfig([defineSeo('/page/{slug}', runtime)]);
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory, config);

    const [match] = await processor({ qpqEventRecord: { path: '/page/caf%C3%A9' } });

    expect((match as any).runtimeOptions).toEqual({ slug: 'café' });
  });
});
