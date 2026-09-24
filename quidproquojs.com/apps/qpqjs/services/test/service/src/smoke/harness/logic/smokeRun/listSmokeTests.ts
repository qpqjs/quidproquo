import { smokeSuites } from '../../../suites/smokeSuites';
import { SmokeTestDefinition } from '../../types/SmokeTestDefinition';

/** Every registered test across all suites, in list order; a test's 1-based position is its run record id. */
export const listSmokeTests = (): SmokeTestDefinition[] =>
  smokeSuites.flatMap((suite) => suite.tests);
