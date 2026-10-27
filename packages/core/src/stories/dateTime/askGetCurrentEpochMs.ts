import { askDateNow } from '../../actions';
import { AskResponse } from '../../types';

export function* askGetCurrentEpochMs(): AskResponse<number> {
  const currentDateTime = yield* askDateNow();

  const dateObj = new Date(currentDateTime);

  return dateObj.getTime();
}
