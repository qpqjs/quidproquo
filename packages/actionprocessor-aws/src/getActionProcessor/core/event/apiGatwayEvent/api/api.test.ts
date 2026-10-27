import { buildTestQpqConfig, ErrorTypeEnum, EventActionType } from 'quidproquo-core';
import { defineFileUploadSettings, FileUploadErrorTypeEnum, QPQWebServerConfigSettingType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { resolveEventProcessor } from '../../../../../testing/eventProcessorTestHelpers';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

const MODULE_NAME = 'test-module';

const buildApiGatewayEvent = (overrides: Record<string, any> = {}): any => ({
  path: `/${MODULE_NAME}/users`,
  httpMethod: 'GET',
  headers: {},
  body: null,
  isBase64Encoded: false,
  multiValueQueryStringParameters: null,
  queryStringParameters: null,
  requestContext: { identity: { sourceIp: '1.2.3.4' } },
  ...overrides,
});

const context = { awsRequestId: 'req-1' } as any;

describe('apiGatwayEvent/api getEventGetRecordsActionProcessor', () => {
  it('strips the service name prefix from the path and maps the event to an internal record', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);

    const [records] = await processor({ eventParams: [buildApiGatewayEvent(), context] });

    expect(records).toEqual([
      {
        path: '/users',
        query: {},
        body: undefined,
        headers: {},
        method: 'GET',
        correlation: 'req-1',
        sourceIp: '1.2.3.4',
        isBase64Encoded: false,
      },
    ]);
  });

  it('merges multi value and single value query string parameters', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const event = buildApiGatewayEvent({
      multiValueQueryStringParameters: { tags: ['a', 'b'] },
      queryStringParameters: { page: '1' },
    });

    const [records] = await processor({ eventParams: [event, context] });

    expect((records as any[])[0].query).toEqual({ tags: ['a', 'b'], page: '1' });
  });

  it('parses multipart form data into files', async () => {
    const boundary = 'b';
    const body = `--${boundary}\r\nContent-Disposition: form-data; name="f"; filename="a.txt"\r\nContent-Type: text/plain\r\n\r\nhi\r\n--${boundary}--\r\n`;
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const event = buildApiGatewayEvent({ headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` }, body });

    const [records] = await processor({ eventParams: [event, context] });

    expect((records as any[])[0].files).toEqual([{ filename: 'a.txt', mimetype: 'text/plain', base64Data: Buffer.from('hi').toString('base64') }]);
  });

  it('stamps a fileUploadError on the record instead of throwing when upload validation fails', async () => {
    const boundary = 'b';
    const body = `--${boundary}\r\nContent-Disposition: form-data; name="f"; filename="a.txt"\r\nContent-Type: text/plain\r\n\r\nway too many bytes\r\n--${boundary}--\r\n`;
    const config = buildTestQpqConfig([defineFileUploadSettings({ maxFileSizeBytes: 4 })]);
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords, config);
    const event = buildApiGatewayEvent({ headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` }, body });

    const [records] = await processor({ eventParams: [event, context] });

    expect((records as any[])[0].files).toBeUndefined();
    expect((records as any[])[0].fileUploadError.errorType).toBe(FileUploadErrorTypeEnum.fileTooLarge);
  });

  it('stamps a malformed fileUploadError when the multipart body cannot be parsed', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const event = buildApiGatewayEvent({ headers: { 'Content-Type': 'multipart/form-data' }, body: 'not multipart' });

    const [records] = await processor({ eventParams: [event, context] });

    expect((records as any[])[0].fileUploadError.errorType).toBe(FileUploadErrorTypeEnum.malformed);
  });
});

describe('apiGatwayEvent/api getEventMatchStoryActionProcessor', () => {
  it('returns a NotFound error when no route matches', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory);

    const [, error] = await processor({ qpqEventRecord: { path: '/missing', method: 'GET', headers: {} } });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('matches the request to a configured route', async () => {
    const runtime = { src: 'handler', runtimeType: 'Function' } as any;
    const config = buildTestQpqConfig([
      {
        configSettingType: QPQWebServerConfigSettingType.Route,
        uniqueKey: 'GET/users',
        path: '/users',
        method: 'GET',
        runtime,
        options: { allowedOrigins: [] },
      } as any,
    ]);
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory, config);

    const [match] = await processor({ qpqEventRecord: { path: '/users', method: 'GET', headers: {} } });

    expect((match as any).runtime).toEqual(runtime);
  });
});

describe('apiGatwayEvent/api getEventTransformResponseResultActionProcessor', () => {
  it('maps a successful record to an api gateway result with cors headers', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const record = { success: true, result: { status: 200, body: 'ok', headers: { 'x-custom': 'v' }, isBase64Encoded: false } };

    const [response] = await processor({ eventParams: [buildApiGatewayEvent(), context], qpqEventRecordResponses: [record] });

    expect((response as any).statusCode).toBe(200);
    expect((response as any).body).toBe('ok');
    expect((response as any).headers['x-custom']).toBe('v');
    expect((response as any).headers['Access-Control-Allow-Headers']).toBe('Authorization, Content-Type');
  });

  it('returns an empty body for HEAD requests', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const record = { success: true, result: { status: 200, body: 'ok', headers: {} } };

    const [response] = await processor({ eventParams: [buildApiGatewayEvent({ httpMethod: 'HEAD' }), context], qpqEventRecordResponses: [record] });

    expect((response as any).body).toBe('');
  });

  it('transforms an error record into the mapped http status code', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const record = { success: false, error: { errorType: ErrorTypeEnum.NotFound, errorText: 'nope' } };

    const [response] = await processor({ eventParams: [buildApiGatewayEvent(), context], qpqEventRecordResponses: [record] });

    expect((response as any).statusCode).toBe(404);
    expect(JSON.parse((response as any).body)).toEqual({ errorType: ErrorTypeEnum.NotFound, errorText: 'nope' });
  });

  it("answers with the matched route's own allowed origin, as its preflight does", async () => {
    const config = buildTestQpqConfig([
      {
        configSettingType: QPQWebServerConfigSettingType.Route,
        uniqueKey: 'POST/signer/session',
        path: '/signer/session',
        method: 'POST',
        runtime: { src: 'handler', runtimeType: 'Function' },
        options: { allowedOrigins: ['https://sign.example.com'] },
      } as any,
    ]);
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult, config);
    const record = { success: true, result: { status: 200, body: 'ok', headers: {} } };
    const fromSigningSite = (path: string) =>
      processor({
        eventParams: [
          buildApiGatewayEvent({ path: `/${MODULE_NAME}${path}`, httpMethod: 'POST', headers: { Origin: 'https://sign.example.com' } }),
          context,
        ],
        qpqEventRecordResponses: [record],
      });

    const [matched] = await fromSigningSite('/signer/session');
    const [unmatched] = await fromSigningSite('/elsewhere');

    expect((matched as any).headers['Access-Control-Allow-Origin']).toBe('https://sign.example.com');
    expect((unmatched as any).headers['Access-Control-Allow-Origin']).not.toBe('https://sign.example.com');
  });

  it('rejects a non-string body with a generic error response', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const record = { success: true, result: { status: 200, body: { not: 'a string' }, headers: {} } };

    const [response] = await processor({ eventParams: [buildApiGatewayEvent(), context], qpqEventRecordResponses: [record] });

    expect((response as any).statusCode).toBe(500);
    expect(JSON.parse((response as any).body).errorText).toBe('Response body must be a string');
  });
});
