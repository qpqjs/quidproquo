import { ErrorTypeEnum, EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

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
