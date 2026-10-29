import { askContextRead } from '../../actions/context/askContextRead';
import { askThrowError } from '../../actions/error/askThrowError';
import { AskResponse, QpqContextIdentifier, QPQError } from '../../types';

/**
 * Builds a reader that throws `errorType` with `message` when nothing has provided the context,
 * for values a story cannot sensibly run without (an active scope, a signed-in user). A value
 * counts as unprovided when the read comes back `undefined` or `null`, which is what an
 * identifier declared with an empty default yields outside its provider.
 */
export function createContextReaderOrThrow<R>(contextIdentifier: QpqContextIdentifier<R>, errorType: QPQError['errorType'], message: string) {
  return function* askContextReadOrThrowWrapper(): AskResponse<NonNullable<R>> {
    const value = yield* askContextRead(contextIdentifier);

    if (value === undefined || value === null) {
      return yield* askThrowError(errorType, message);
    }

    return value;
  };
}
