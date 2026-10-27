import { DynamicModuleLoader, QPQConfig, UserScriptRunnerEvent } from '@qpqjs/core';

import { handleUserScriptRunnerEvent } from './handleUserScriptRunnerEvent';

/**
 * The child side of runUserScriptInChild: waits for the one event the parent sends, answers
 * it over IPC and exits. A child entry module's whole body is one call to this.
 */
export const runUserScriptChildMain = (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader): void => {
  // `on`, not `once`: Node drops the IPC channel's hold on the process once the last
  // 'message' listener is gone, and a script awaiting a promise that never settles would
  // then exit with nothing pending instead of being timed out by the parent.
  process.on('message', async (event) => {
    const result = await handleUserScriptRunnerEvent(event as UserScriptRunnerEvent, qpqConfig, dynamicModuleLoader);
    process.send?.(result, () => process.exit(0));
  });
};
