import { createActionRequester } from '../../types';
import { QpqIsoDateTime } from '../../types/QpqIsoDateTime';
import { DateActionType } from './DateActionType';

export const askDateNow = createActionRequester<QpqIsoDateTime>()({
  actionType: DateActionType.Now,
});
