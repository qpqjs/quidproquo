import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  askFileStreamOpenBase,
  composeStorageDriveFilePathOrThrow,
  createActionProcessor,
  ErrorTypeEnum,
  FileActionType,
  ProcessorFor,
  QPQConfig,
} from 'quidproquo-core';

import { Readable } from 'stream';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { randomGuid } from '../../../awsLambdaUtils';
import { createAwsClient } from '../../../logic/createAwsClient';
import { resolveStorageDriveBucketName } from './utils';

async function* chunkedReadableIterator(stream: Readable, chunkSize: number, transform: (buf: Buffer) => string): AsyncIterableIterator<string> {
  let buffer = Buffer.alloc(0);

  for await (const chunk of stream) {
    const incoming = typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : (chunk as Buffer);
    buffer = Buffer.concat([buffer, incoming]);

    while (buffer.length >= chunkSize) {
      yield transform(buffer.subarray(0, chunkSize));
      buffer = buffer.subarray(chunkSize);
    }
  }

  if (buffer.length > 0) {
    yield transform(buffer);
  }
}

const getProcessFileStreamOpen = (qpqConfig: QPQConfig): ProcessorFor<typeof askFileStreamOpenBase> => {
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
      const s3BucketName = resolveStorageDriveBucketName(drive, qpqConfig);
      const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);
      const s3Client = createAwsClient(S3Client, { region });

      const response = await s3Client.send(
        new GetObjectCommand({
          Key: composeStorageDriveFilePathOrThrow(qpqConfig, drive, scope, filepath),
          Bucket: s3BucketName,
        }),
      );

      if (!response.Body) {
        return actionResultError(ErrorTypeEnum.GenericError, `Empty response body for: ${filepath}`);
      }

      const streamId = `s3-${randomGuid()}`;
      const isText = encoding === 'text';
      const size = chunkSize ?? 65536;
      const transform = isText ? (buf: Buffer) => buf.toString('utf8') : (buf: Buffer) => buf.toString('base64');
      const iterator = chunkedReadableIterator(response.Body as Readable, size, transform);
      streamRegistry.register(streamId, iterator);

      return actionResult({ id: streamId, encoding });
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        InvalidObjectState: () => actionResultError(askFileStreamOpenBase.errorType.InvalidStorageClass, 'File is in the wrong storage class'),
        NoSuchKey: () => actionResultError(askFileStreamOpenBase.errorType.FileNotFound, `File not found: ${filepath}`),
        NotFound: () => actionResultError(askFileStreamOpenBase.errorType.FileNotFound, `File not found: ${filepath}`),
        InvalidScopeError: (error) => actionResultError(askFileStreamOpenBase.errorType.InvalidScope, error.message),
      });
    }
  };
};

export const getFileStreamOpenActionProcessor = createActionProcessor(askFileStreamOpenBase, getProcessFileStreamOpen);
