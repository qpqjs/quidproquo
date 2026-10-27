import { buildTestQpqConfig, ErrorTypeEnum, EventActionType } from 'quidproquo-core';
import { QPQWebServerConfigSettingType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { resolveEventProcessor } from '../../../../testing/eventProcessorTestHelpers';
import { getEventAutoRespondActionProcessor } from './getEventAutoRespondActionProcessor';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';
import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

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

describe('cloudFrontOriginRequest getEventMatchStoryActionProcessor', () => {
  it('returns a NotFound error when no seo config matches', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory);

    const [, error] = await processor({ qpqEventRecord: { path: '/missing' } });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('matches the request path to a configured seo entry', async () => {
    const runtime = { src: 'seo' } as any;
    const config = buildTestQpqConfig([{ configSettingType: QPQWebServerConfigSettingType.Seo, path: '/page', runtime } as any]);
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory, config);

    const [match] = await processor({ qpqEventRecord: { path: '/page' } });

    expect((match as any).runtime).toEqual(runtime);
  });
});

describe('cloudFrontOriginRequest getEventTransformResponseResultActionProcessor', () => {
  it('falls back to the cdn request when the response is marked fallbackToCDN', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const cfRequest = buildCloudFrontRequest('/page').cf.request;
    const record = { success: true, result: { fallbackToCDN: true } };

    const [response] = await processor({ eventParams: [{ Records: [{ cf: { request: cfRequest } }] }], qpqEventRecordResponses: [record] });

    expect(response).toBe(cfRequest);
  });

  it('builds a cloudfront response from a successful seo record', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const record = { success: true, result: { status: 200, body: 'hi', headers: { 'x-a': 'b' }, bodyEncoding: 'text' } };

    const [response] = await processor({ eventParams: [{ Records: [] }], qpqEventRecordResponses: [record] });

    expect(response).toEqual({
      status: '200',
      statusDescription: 'OK',
      body: 'hi',
      headers: { 'x-a': [{ value: 'b' }] },
      bodyEncoding: 'text',
    });
  });

  it('falls back to the cdn for an error record (error responses set fallbackToCDN)', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const cfRequest = buildCloudFrontRequest('/page').cf.request;
    const record = { success: false, error: { errorType: ErrorTypeEnum.NotFound, errorText: 'gone' } };

    const [response] = await processor({ eventParams: [{ Records: [{ cf: { request: cfRequest } }] }], qpqEventRecordResponses: [record] });

    expect(response).toBe(cfRequest);
  });
});

describe('cloudFrontOriginRequest auto respond and story session', () => {
  it('auto responds with null', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor, EventActionType.AutoRespond);

    expect(await processor({})).toEqual([null]);
  });

  it('returns no story session', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession);

    expect(await processor({ qpqEventRecord: {}, eventParams: [] })).toEqual([undefined]);
  });
});
