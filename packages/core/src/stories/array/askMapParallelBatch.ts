import { askDelay, askThrowError } from '../../actions';
import { AskResponse, ErrorTypeEnum } from '../../types';
import { askMapParallel } from './askMapParallel';

export function* askMapParallelBatch<T, R>(
  items: T[],
  numBatch: number,
  askCallback: (item: T, index: number, srcArray: T[]) => AskResponse<R>,
  delayAfterEachBatchMs = 0,
): AskResponse<R[]> {
  // A batch size below one would remove nothing per iteration and loop forever.
  // The negated >= comparison also rejects NaN.
  if (!(numBatch >= 1)) {
    return yield* askThrowError(ErrorTypeEnum.Invalid, `numBatch must be at least 1, got ${numBatch}`);
  }

  // Copy the items array to avoid modifying the original array
  let itemsToBatch = [...items];

  // Prepare an array to collect all results
  let allResults: R[] = [];

  // Continue creating batches until itemsToBatch is empty
  while (itemsToBatch.length > 0) {
    // Remove the first numBatch items from itemsToBatch to create a batch
    const batch = itemsToBatch.splice(0, numBatch);

    // askMapParallel only sees the batch slice, so re-base the callback's index and
    // srcArray onto the original array to keep the same semantics as askMap.
    const batchStartIndex = allResults.length;
    function* askCallbackOnOriginalArray(item: T, batchIndex: number): AskResponse<R> {
      return yield* askCallback(item, batchStartIndex + batchIndex, items);
    }

    // Process the current batch using askMapParallel and collect results
    const batchResults: R[] = yield* askMapParallel<T, R>(batch, askCallbackOnOriginalArray);
    allResults = allResults.concat(batchResults);

    // If there is a delay after each batch, wait for the delay
    if (delayAfterEachBatchMs > 0) {
      // Wait for a delay after each batch
      yield* askDelay(delayAfterEachBatchMs);
    }
  }

  return allResults;
}
