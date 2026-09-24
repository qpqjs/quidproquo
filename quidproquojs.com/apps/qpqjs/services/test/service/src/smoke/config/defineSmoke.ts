import { QPQConfig } from 'quidproquo';

import { defineSmokeHarness } from '../harness/config/defineSmokeHarness';
import { smokeSuites } from '../suites/smokeSuites';

/** The whole smoke feature: the harness plus the resources of every registered suite. */
export const defineSmoke = (): QPQConfig => [
  defineSmokeHarness(),
  smokeSuites.map((suite) => suite.defineConfig?.() ?? []),
];
