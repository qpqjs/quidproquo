import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileStreamOpenBase,
  createActionProcessor,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { randomUUID } from 'crypto';
import * as fs from 'fs';
import { Readable } from 'stream';

import { FileStorageConfig } from './types';
import { resolveFilePath } from './utils';

async function* textStreamIterator(stream: Readable): AsyncIterableIterator<string> {
  for await (const chunk of stream) {
    yield typeof chunk === 'string' ? chunk : (chunk as Buffer).toString('utf8');
  }
}

async function* binaryStreamIterator(stream: Readable): AsyncIterableIterator<string> {
  for await (const chunk of stream) {
    const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer);
    yield buffer.toString('base64');
  }
}

const getProcessFileStreamOpen = (qpqConfig: QPQConfig, config: FileStorageConfig): ProcessorFor<typeof askFileStreamOpenBase> => {
  return async (
    { drive, filepath, encoding, chunkSize, scope },
    session,
    actionProcessors,
    logger,
    updateSession,
    dynamicModuleLoader,
    streamRegistry,
  ) => {
    try {
      const fullPath = resolveFilePath(config, qpqConfig, drive, filepath, scope);
      const isText = encoding === 'text';
      const highWaterMark = chunkSize ?? 65536;
      const readStream = fs.createReadStream(fullPath, isText ? { encoding: 'utf8', highWaterMark } : { highWaterMark });
      const streamId = `file-${randomUUID()}`;

      const iterator = isText ? textStreamIterator(readStream) : binaryStreamIterator(readStream);
      streamRegistry.register(streamId, iterator);

      return actionResult({ id: streamId, encoding });
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        InvalidScopeError: (error) => actionResultError(askFileStreamOpenBase.errorType.InvalidScope, error.message),
        ENOENT: () => actionResultError(askFileStreamOpenBase.errorType.FileNotFound, `File not found: ${filepath}`), // node fs code
      });
    }
  };
};

export const getFileStreamOpenActionProcessor = (config: FileStorageConfig) =>
  createActionProcessor(askFileStreamOpenBase, (qpqConfig) => getProcessFileStreamOpen(qpqConfig, config));
