import { runUserScriptChildMain } from '@qpqjs/actionprocessor-node';

import { dynamicModuleLoader } from '../dynamicModuleLoader';
import { getQpqConfig } from '../lambda-utils';

/**
 * The runner's child process: forked per invoke by the runner handler, serves one script
 * call over IPC and exits. Bundled beside the handler because its entry name carries the
 * slash, which is what puts it in the runner's zip.
 */
export const main = (): void => {
  runUserScriptChildMain(getQpqConfig(), dynamicModuleLoader);
};

main();
