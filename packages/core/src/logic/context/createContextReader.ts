import { askContextRead } from '../../actions';
import { AskResponse, QpqContextIdentifier } from '../../types';

export function createContextReader<R>(contextIdentifier: QpqContextIdentifier<R>) {
  return function* askContextReadWrapper(): AskResponse<R> {
    return yield* askContextRead(contextIdentifier);
  };
}
