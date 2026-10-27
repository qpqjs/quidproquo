import { QpqContext } from '../../types';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { ContextActionType } from './ContextActionType';

// Reads the whole serializable context stack. Stories reach for askContextRead with a
// specific identifier; this exists for the runtime itself (askContextProvideValue relays
// it to build the parent chain) and for the log viewer.
export const askContextList = createActionRequester<QpqContext<any>>()({
  actionType: ContextActionType.List,
});
