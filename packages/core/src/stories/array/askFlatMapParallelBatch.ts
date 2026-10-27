import { AskResponse } from '../../types';
import { askMapParallelBatch } from './askMapParallelBatch';

export function* askFlatMapParallelBatch<T, R>(
  items: T[],
  numBatch: number,
  askCallback: (item: T, index: number, srcArray: T[]) => AskResponse<R[]>,
  delayAfterEachBatchMs = 0,
): AskResponse<R[]> {
  const results = yield* askMapParallelBatch(items, numBatch, askCallback, delayAfterEachBatchMs);

  return results.flat();
}
