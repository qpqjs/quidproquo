import { createActionRequester } from '../../logic/actions/createActionRequester';
import { AskResponse } from '../../types/StorySession';
import { StreamChunk, StreamDataType, StreamEncoding, StreamHandle } from '../../types/StreamRegistry';
import { StreamActionType } from './StreamActionType';

const decodeBase64ToUint8Array = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

// Chunks always cross the runtime boundary as strings; this story decodes them into
// the shape the handle's encoding promises.
export const askStreamReadBase = createActionRequester<StreamChunk<string>>()({
  actionType: StreamActionType.Read,
  errorTypes: [
    'StreamNotFound', // no open stream has this id: it was never registered, already finished, failed or was closed
    'StreamFailed', // the stream's producer threw; its message is relayed in errorText
  ],
  getPayload: (streamId: string, noWait?: boolean) => ({ streamId, noWait }),
});

function* askStreamReadTyped<E extends StreamEncoding, T = unknown>(
  handle: StreamHandle<E, T>,
  noWait?: boolean,
): AskResponse<StreamChunk<StreamDataType<E, T>>> {
  const rawChunk = yield* askStreamReadBase(handle.id, noWait);

  if (!rawChunk.data || rawChunk.done || rawChunk.skipped) {
    return rawChunk as StreamChunk<StreamDataType<E, T>>;
  }

  if (handle.encoding === 'binary') {
    return { ...rawChunk, data: decodeBase64ToUint8Array(rawChunk.data) } as StreamChunk<StreamDataType<E, T>>;
  }

  if (handle.encoding === 'json') {
    return { ...rawChunk, data: JSON.parse(rawChunk.data) } as StreamChunk<StreamDataType<E, T>>;
  }

  return rawChunk as StreamChunk<StreamDataType<E, T>>;
}

/** Reads the next chunk of a stream in the shape its handle's encoding promises. Carries the base requester's `errorType` catalog so callers can match on it. */
export const askStreamRead = Object.assign(askStreamReadTyped, { errorType: askStreamReadBase.errorType });
