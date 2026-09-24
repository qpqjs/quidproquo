import { QPQConfig } from 'quidproquo';

import { SmokeTestDefinition } from './SmokeTestDefinition';

/**
 * One folder under suites/: its tests plus the resources and handlers only
 * they use. Tests that share a resource belong in the same suite, so deleting
 * a suite's folder and its line in smokeSuites removes it completely.
 */
export type SmokeSuite = {
  tests: SmokeTestDefinition[];
  defineConfig?: () => QPQConfig;
};
