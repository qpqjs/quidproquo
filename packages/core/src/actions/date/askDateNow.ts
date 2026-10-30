import { createActionRequester } from '../../logic/actions';
import { QpqIsoDateTime } from '../../types/QpqIsoDateTime';
import { DateActionType } from './DateActionType';

export const askDateNow = createActionRequester<QpqIsoDateTime>()({
  actionType: DateActionType.Now,
});
