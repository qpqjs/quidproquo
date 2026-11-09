import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { defineReportsSmoke } from './config/defineReportsSmoke';
import { askRunCrossServiceReportsTest } from './logic/askRunCrossServiceReportsTest';
import { askRunReportsTest } from './logic/askRunReportsTest';

/** Append to a report and read it back: on the owner, and from testa through its references to the owner's bus and stores. */
export const reportsSmokeSuite: SmokeSuite = {
  defineConfig: defineReportsSmoke,
  tests: [
    { name: 'reports', askRun: askRunReportsTest },
    { name: 'reportsCrossService', askRun: askRunCrossServiceReportsTest },
  ],
};
