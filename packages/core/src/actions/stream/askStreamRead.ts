import { AskResponse } from '../../types/StorySession';
import { StreamChunk, StreamDataType, StreamEncoding, StreamHandle } from '../../types/StreamRegistry';
import { createActionRequester } from '../../types/utils/createActionRequester';
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
  getPayload: (streamId: string, noWait?: boolean) => ({ streamId, noWait }),
});

export function* askStreamRead<E extends StreamEncoding, T = unknown>(
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
