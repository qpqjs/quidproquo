import { EventActionType } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';
import { defineFileUploadSettings, FileUploadErrorTypeEnum } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';

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
