import { askStreamClose } from '../../actions/stream/askStreamClose';
import { askStreamRead } from '../../actions/stream/askStreamRead';
import { AskResponse } from '../../types';
import { StreamDataType, StreamEncoding, StreamHandle } from '../../types/StreamRegistry';
import { askCatch } from '../system/askCatch';
import { askCloseStreamAndRethrow } from './askCloseStreamAndRethrow';

export function* askStreamMap<E extends StreamEncoding, T, R = StreamDataType<E, T>>(
  handle: StreamHandle<E, T>,
  askCallback: (item: StreamDataType<E, T>, index: number) => AskResponse<R> = function* (item): AskResponse<R> {
    return item as unknown as R;
  },
): AskResponse<R[]> {
  const results: R[] = [];
  let index = 0;

  while (true) {
    // Reads and the callback are run under askCatch so a failure still closes the stream
    // before the error is rethrown. The runtime abandons a story's generators on an
    // unprotected failure, so without this the stream would leak when a surrounding
    // askCatch keeps the story alive.
    const readResult = yield* askCatch(askStreamRead(handle));

    if (!readResult.success) {
      return yield* askCloseStreamAndRethrow(handle, readResult.error);
    }

    const { done, skipped, data } = readResult.result;

    if (done) {
      break;
    }

    if (skipped || data === undefined) {
      continue;
    }

    const callbackResult = yield* askCatch(askCallback(data, index));

    if (!callbackResult.success) {
      return yield* askCloseStreamAndRethrow(handle, callbackResult.error);
    }

    results.push(callbackResult.result);
    index += 1;
  }

  yield* askStreamClose(handle);

  return results;
}
