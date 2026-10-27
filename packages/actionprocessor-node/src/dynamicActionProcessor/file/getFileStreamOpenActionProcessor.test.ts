import {
  askFileStreamOpenBase,
  createStreamRegistry,
  ErrorTypeEnum,
  FileActionType,
  resolveActionResult,
  resolveActionResultError,
  StreamRegistry,
} from 'quidproquo-core';

import * as fs from 'fs';
import { Readable } from 'stream';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { errorWithCode, fileConfig, resolveFileProcessors } from '../../testing/fileProcessorTestHelpers';
import { getFileStreamOpenActionProcessor } from './getFileStreamOpenActionProcessor';

vi.mock('fs');

const invoke = async (payload: { encoding: string; chunkSize?: number }, streamRegistry: StreamRegistry) => {
  const processors = await resolveFileProcessors(getFileStreamOpenActionProcessor(fileConfig));
  const process = processors[FileActionType.StreamOpen] as (p: any, ...rest: any[]) => Promise<any>;
  return process({ drive: 'media', filepath: 'a.txt', ...payload }, undefined, undefined, undefined, undefined, undefined, streamRegistry);
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('getFileStreamOpenActionProcessor', () => {
  it('registers a text stream that yields decoded chunks', async () => {
    vi.mocked(fs.createReadStream).mockReturnValue(Readable.from(['hello']) as any);
    const registry = createStreamRegistry();

    const result = await invoke({ encoding: 'text' }, registry);

    const handle = resolveActionResult(result) as { encoding: string; id: string };
    expect(handle.encoding).toBe('text');
    expect(registry.has(handle.id)).toBe(true);
    expect((await registry.read(handle.id)).data).toBe('hello');
  });

  it('registers a binary stream that yields base64 chunks', async () => {
    vi.mocked(fs.createReadStream).mockReturnValue(Readable.from([Buffer.from('hi')]) as any);
    const registry = createStreamRegistry();

    const result = await invoke({ encoding: 'binary' }, registry);

    const handle = resolveActionResult(result) as { encoding: string; id: string };
    expect((await registry.read(handle.id)).data).toBe(Buffer.from('hi').toString('base64'));
  });

  it('returns FileNotFound when the file does not exist', async () => {
    vi.mocked(fs.createReadStream).mockImplementation(() => {
      throw errorWithCode('ENOENT');
    });

    const result = await invoke({ encoding: 'text' }, createStreamRegistry());

    expect(resolveActionResultError(result).errorType).toBe(askFileStreamOpenBase.errorType.FileNotFound);
  });

  it('returns GenericError for any other failure', async () => {
    vi.mocked(fs.createReadStream).mockImplementation(() => {
      throw errorWithCode('EACCES');
    });

    const result = await invoke({ encoding: 'text' }, createStreamRegistry());

    expect(resolveActionResultError(result).errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
