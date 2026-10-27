import { askThrowError } from '../../actions/error/askThrowError';
import { askStreamClose } from '../../actions/stream/askStreamClose';
import { AskResponse, QPQError } from '../../types';
import { StreamHandle } from '../../types/StreamRegistry';

// Shared failure path for the stream stories: close the stream first so the source is not
// leaked, then rethrow the original error. Deliberately not exported from the stream index.
// Never returns normally, but askThrowError is typed as AskResponse<any>, so this is too.
export function* askCloseStreamAndRethrow(handle: StreamHandle, error: QPQError): AskResponse<any> {
  yield* askStreamClose(handle);

  return yield* askThrowError(error.errorType, error.errorText, error.errorStack);
}
