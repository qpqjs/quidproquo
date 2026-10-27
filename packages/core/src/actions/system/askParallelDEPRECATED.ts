// NOTE: System actions have no platform specific processors and/or requestors
// and therefore do not need to implement a SystemActionProcessor.ts

import { AskResponse } from '../../types/StorySession';
import { askBatch } from './askBatch';

/**
 * @deprecated since version X.X. Please use {@link askRunParallel} instead.
 * Runs n number of stories in parallel. This function is deprecated and has been replaced
 * by a more efficient and type-supported version. The replacement function provides
 * improved performance and better type support.
 *
 * @param {Array<any>} stories - An array of stories to be run in parallel.
 * @returns {AskResponse<any[]>} The result of each story, in the order they were given.
 */
export function* askParallelDEPRECATED(stories: Array<any>): AskResponse<any[]> {
  const itt = stories.map((s: any) => s[0](...s.slice(1)));
  let actions = itt.map((i: any) => i.next());
  let values: Array<any> = actions.map((a) => a.value);

  while (true) {
    // Batch any actions that we have not processed yet
    const actionsToBatch = actions.map((a) => (!a.done ? a.value : null));

    // Only send the still-pending actions to the runtime: a story that has already
    // finished leaves a null hole, and a null action crashes the batch processor.
    // Results are scattered back into their original positions afterwards.
    const pendingActions = actionsToBatch.filter((atb) => !!atb);

    // Only batch actions when there are some to batch
    // People may batch stories together that actually dont have actions in them!?
    if (pendingActions.length) {
      const pendingResults = yield* askBatch(pendingActions);

      let pendingIndex = 0;
      values = actionsToBatch.map((atb) => (atb ? pendingResults[pendingIndex++] : undefined));
    }

    // Calculate real values
    let done = true;
    for (let i = 0; i < stories.length; i++) {
      if (!actions[i].done) {
        actions[i] = itt[i].next(values[i]);
        if (!actions[i].done) {
          done = false;
        }
      }
    }

    if (done) {
      return actions.map((a) => a.value);
    }
  }
}
