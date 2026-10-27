import { FileUploadErrorTypeEnum, FileUploadSettings } from 'quidproquo-webserver';

import { APIGatewayEvent } from 'aws-lambda';
import { describe, expect, it } from 'vitest';

import { FileUploadValidationError, parseMultipartFormData, sanitizeFilename } from './parseMultipartFormData';

const BOUNDARY = 'testboundary';

const buildMultipartBody = (parts: string[]): string => `${parts.map((p) => `--${BOUNDARY}\r\n${p}`).join('')}--${BOUNDARY}--\r\n`;

const filePart = (name: string, filename: string, contentType: string, content: string): string =>
  `Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n${content}\r\n`;

const fieldPart = (name: string, value: string): string => `Content-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`;

const buildEvent = (body: string, headers: Record<string, string>, isBase64Encoded = false): APIGatewayEvent =>
  ({ body, headers, isBase64Encoded }) as unknown as APIGatewayEvent;

const defaultSettings: FileUploadSettings = {
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxFileCount: 10,
  maxFieldCount: 100,
  maxFieldSizeBytes: 1024 * 1024,
};

const multipartHeaders = { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` };

const expectUploadError = async (promise: Promise<unknown>, errorType: FileUploadErrorTypeEnum) => {
  const error = await promise.then(
    () => null,
    (e) => e,
  );

  expect(error).toBeInstanceOf(FileUploadValidationError);
  expect(error.errorType).toBe(errorType);
};

describe('parseMultipartFormData', () => {
  it('returns base64 encoded file records mapped to QPQBinaryData', async () => {
    const body = buildMultipartBody([filePart('upload', 'hello.txt', 'text/plain', 'hello world')]);

    const files = await parseMultipartFormData(buildEvent(body, multipartHeaders), defaultSettings);

    expect(files).toEqual([
      {
        filename: 'hello.txt',
        mimetype: 'text/plain',
        base64Data: Buffer.from('hello world').toString('base64'),
      },
    ]);
  });

  it('ignores fields and only returns files', async () => {
    const body = buildMultipartBody([fieldPart('name', 'joe'), filePart('upload', 'a.txt', 'text/plain', 'abc')]);

    const files = await parseMultipartFormData(buildEvent(body, multipartHeaders), defaultSettings);

    expect(files).toHaveLength(1);
    expect(files[0].filename).toBe('a.txt');
  });

  it('skips empty files', async () => {
    const body = buildMultipartBody([filePart('upload', 'empty.txt', 'text/plain', '')]);

    const files = await parseMultipartFormData(buildEvent(body, multipartHeaders), defaultSettings);

    expect(files).toEqual([]);
  });

  it('reads the Content-Type header when content-type is absent', async () => {
    const body = buildMultipartBody([filePart('upload', 'cased.txt', 'text/plain', 'data')]);

    const files = await parseMultipartFormData(buildEvent(body, { 'Content-Type': `multipart/form-data; boundary=${BOUNDARY}` }), defaultSettings);

    expect(files[0].filename).toBe('cased.txt');
  });

  it('decodes a base64 encoded event body', async () => {
    const rawBody = buildMultipartBody([filePart('upload', 'b64.txt', 'text/plain', 'payload')]);
    const body = Buffer.from(rawBody, 'binary').toString('base64');

    const files = await parseMultipartFormData(buildEvent(body, multipartHeaders, true), defaultSettings);

    expect(files[0].base64Data).toBe(Buffer.from('payload').toString('base64'));
  });

  it('rejects with fileTooLarge when a file exceeds maxFileSizeBytes', async () => {
    const body = buildMultipartBody([filePart('upload', 'big.bin', 'application/octet-stream', 'x'.repeat(64))]);

    await expectUploadError(
      parseMultipartFormData(buildEvent(body, multipartHeaders), { ...defaultSettings, maxFileSizeBytes: 16 }),
      FileUploadErrorTypeEnum.fileTooLarge,
    );
  });

  it('rejects with tooManyFiles when the file count exceeds maxFileCount', async () => {
    const body = buildMultipartBody([
      filePart('a', 'a.txt', 'text/plain', 'a'),
      filePart('b', 'b.txt', 'text/plain', 'b'),
      filePart('c', 'c.txt', 'text/plain', 'c'),
    ]);

    await expectUploadError(
      parseMultipartFormData(buildEvent(body, multipartHeaders), { ...defaultSettings, maxFileCount: 2 }),
      FileUploadErrorTypeEnum.tooManyFiles,
    );
  });

  it('rejects with tooManyFields when the field count exceeds maxFieldCount', async () => {
    const body = buildMultipartBody([fieldPart('a', '1'), fieldPart('b', '2'), fieldPart('c', '3')]);

    await expectUploadError(
      parseMultipartFormData(buildEvent(body, multipartHeaders), { ...defaultSettings, maxFieldCount: 2 }),
      FileUploadErrorTypeEnum.tooManyFields,
    );
  });

  it('rejects with disallowedMimeType when the content type is not whitelisted', async () => {
    const body = buildMultipartBody([filePart('upload', 'run.sh', 'application/x-sh', 'echo hi')]);

    await expectUploadError(
      parseMultipartFormData(buildEvent(body, multipartHeaders), { ...defaultSettings, allowedMimeTypes: ['image/*', 'application/pdf'] }),
      FileUploadErrorTypeEnum.disallowedMimeType,
    );
  });

  it('accepts content types matching an allowed wildcard or exact entry', async () => {
    const body = buildMultipartBody([filePart('a', 'pic.png', 'image/png', 'png-bytes'), filePart('b', 'doc.pdf', 'application/pdf', 'pdf-bytes')]);

    const files = await parseMultipartFormData(buildEvent(body, multipartHeaders), {
      ...defaultSettings,
      allowedMimeTypes: ['image/*', 'application/pdf'],
    });

    expect(files.map((f) => f.filename)).toEqual(['pic.png', 'doc.pdf']);
  });

  it('sanitizes path traversal out of filenames', async () => {
    const body = buildMultipartBody([filePart('upload', '../../etc/passwd', 'text/plain', 'data')]);

    const files = await parseMultipartFormData(buildEvent(body, multipartHeaders), defaultSettings);

    expect(files[0].filename).toBe('passwd');
  });

  it('rejects a malformed multipart body', async () => {
    await expect(parseMultipartFormData(buildEvent('not multipart', { 'content-type': 'multipart/form-data' }), defaultSettings)).rejects.toThrow();
  });
});

describe('sanitizeFilename', () => {
  it('strips directory segments from unix and windows style paths', () => {
    expect(sanitizeFilename('/tmp/upload/a.txt')).toBe('a.txt');
    expect(sanitizeFilename('..\\..\\windows\\system32\\evil.dll')).toBe('evil.dll');
  });

  it('strips control characters', () => {
    expect(sanitizeFilename('a\u0000b.txt')).toBe('ab.txt');
  });

  it('falls back to unnamed for empty or dot-only names', () => {
    expect(sanitizeFilename(undefined)).toBe('unnamed');
    expect(sanitizeFilename('')).toBe('unnamed');
    expect(sanitizeFilename('..')).toBe('unnamed');
    expect(sanitizeFilename('a/b/..')).toBe('unnamed');
  });
});
