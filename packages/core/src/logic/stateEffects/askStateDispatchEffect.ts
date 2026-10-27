import { askStateDispatch } from '../../actions';
import { AskResponse } from '../../types';
import { Effect } from './Effect';

export function* askStateDispatchEffect<E extends Effect<any, any>>(type: E['type'], payload: E['payload'] = undefined): AskResponse<void> {
  yield* askStateDispatch<E>({
    type,
    payload,
  } as E);
}
