import { buildTestQpqConfig, ErrorTypeEnum, FileActionType } from 'quidproquo-core';

import { Readable } from 'stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createAwsClient } from '../../../logic/createAwsClient';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getFileStreamOpenActionProcessor } from './getFileStreamOpenActionProcessor';

vi.mock('quidproquo-config-aws', () => ({
  qpqConfigAwsUtils: { getApplicationModuleDeployRegion: () => 'us-test-1' },
}));
vi.mock('./utils', () => ({ resolveStorageDriveBucketName: vi.fn(() => 'bucket-x') }));
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {},
  GetObjectCommand: class {
    constructor(public input: unknown) {}
  },
}));
vi.mock('../../../logic/createAwsClient', () => ({ createAwsClient: vi.fn() }));

const send = vi.fn();

const invoke = async (payload: Record<string, unknown>, streamRegistry: unknown) => {
  const processor = (await getFileStreamOpenActionProcessor(buildTestQpqConfig(), null as any))[FileActionType.StreamOpen];
  return invokeProcessor(processor, payload, { streamRegistry });
};

const drain = async (iterator: AsyncIterableIterator<string>) => {
  const chunks: string[] = [];
  for await (const chunk of iterator) {
    chunks.push(chunk);
  }
  return chunks;
};

describe('getProcessFileStreamOpen', () => {
  beforeEach(() => {
    vi.mocked(createAwsClient).mockReturnValue({ send } as never);
    send.mockReset();
  });

  it('registers a text stream split into chunks with a trailing remainder', async () => {
    send.mockResolvedValue({ Body: Readable.from(['hello']) });
    const registry = { register: vi.fn() };

    const [result] = await invoke({ drive: 'assets', filepath: 'a.txt', encoding: 'text', chunkSize: 4 }, registry);

    expect(result).toEqual({ id: expect.stringContaining('s3-'), encoding: 'text' });
    const iterator = registry.register.mock.calls[0][1] as AsyncIterableIterator<string>;
    expect(await drain(iterator)).toEqual(['hell', 'o']);
  });

  it('base64 encodes chunks when encoding is not text', async () => {
    send.mockResolvedValue({ Body: Readable.from(['hi']) });
    const registry = { register: vi.fn() };

    await invoke({ drive: 'assets', filepath: 'a.bin', encoding: 'base64' }, registry);

    const iterator = registry.register.mock.calls[0][1] as AsyncIterableIterator<string>;
    expect(await drain(iterator)).toEqual([Buffer.from('hi').toString('base64')]);
  });

  it('errors when the response body is empty', async () => {
    send.mockResolvedValue({ Body: undefined });

    const [, error] = await invoke({ drive: 'assets', filepath: 'a.txt', encoding: 'text' }, { register: vi.fn() });

    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
    expect(error?.errorText).toContain('Empty response body');
  });

  it('maps a thrown error via the caught-error mapper', async () => {
    send.mockRejectedValue(Object.assign(new Error('x'), { name: 'SomethingBad' }));

    const [, error] = await invoke({ drive: 'assets', filepath: 'a.txt', encoding: 'text' }, { register: vi.fn() });

    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
