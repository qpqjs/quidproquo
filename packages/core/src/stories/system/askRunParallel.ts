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
    // Get all the stories that are not done
    const activeStoryProgress = storyProgress.filter((a) => !a.iteratorResult.done);
    if (activeStoryProgress.length === 0) {
      return storyProgress.map((a) => a.iteratorResult.value) as any;
    }

    // Get the active story actions and batch them for results
    const batchActions = activeStoryProgress.map((a) => a.iteratorResult.value);
    const actionResults = yield* askBatch(batchActions);

    // continue each story with that new value
    for (let i = 0; i < activeStoryProgress.length; i++) {
      const storyIterator = activeStoryProgress[i];
      storyIterator.iteratorResult = storyIterator.iterator.next(actionResults[i]);
    }
  }
}
