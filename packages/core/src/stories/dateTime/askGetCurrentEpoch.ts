import { AskResponse } from '../../types';
import { askGetCurrentEpochMs } from './askGetCurrentEpochMs';

export function* askGetCurrentEpoch(): AskResponse<number> {
  const currentEpochMs = yield* askGetCurrentEpochMs();

  return Math.floor(currentEpochMs / 1000);
}
