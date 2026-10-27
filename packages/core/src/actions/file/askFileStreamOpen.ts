import { AskResponse } from '../../types/StorySession';
import { StreamEncoding, StreamHandle } from '../../types/StreamRegistry';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { FileActionType } from './FileActionType';

export const askFileStreamOpenBase = createActionRequester<StreamHandle>()({
  actionType: FileActionType.StreamOpen,
  errorTypes: [
    'InvalidStorageClass', // object is in cold storage and cannot be streamed directly
    'FileNotFound', // no object exists at the given filepath
    'InvalidScope', // scope is not a valid single path segment
  ],
  getPayload: (drive: string, filepath: string, encoding: StreamEncoding = 'text', chunkSize?: number, scope?: string) => ({
    drive,
    filepath,
    encoding,
    chunkSize,
    scope,
  }),
});

// The handle is tagged with the encoding the caller asked for, so reads come back as
// text or binary chunks without a cast at every call site.
export function* askFileStreamOpen<E extends StreamEncoding = 'text'>(
  drive: string,
  filepath: string,
  encoding: E = 'text' as E,
  chunkSize?: number,
  scope?: string,
): AskResponse<StreamHandle<E>> {
  return (yield* askFileStreamOpenBase(drive, filepath, encoding, chunkSize, scope)) as StreamHandle<E>;
}
