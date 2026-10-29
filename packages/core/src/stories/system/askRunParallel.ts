import { askBatch } from '../../actions';
import { AskResponse, AskResponseReturnType } from '../../types';

export function* askRunParallel<T extends Array<AskResponse<any>>>(
  storyRuntimes: [...T],
): AskResponse<{ [K in keyof T]: AskResponseReturnType<T[K]> }> {
  // Begin executing the stories
  const storyProgress = storyRuntimes.map((input) => ({
    iterator: input,
    iteratorResult: input.next(),
  }));

  while (true) {
    const activeStoryProgress = storyProgress.filter((a) => !a.iteratorResult.done);
    if (activeStoryProgress.length === 0) {
      return storyProgress.map((a) => a.iteratorResult.value) as any;
    }

    const batchActions = activeStoryProgress.map((a) => a.iteratorResult.value);
    const actionResults = yield* askBatch(batchActions);

    // continue each story with that new value
    for (const [i, storyIterator] of activeStoryProgress.entries()) {
      storyIterator.iteratorResult = storyIterator.iterator.next(actionResults[i]);
    }
  }
}
