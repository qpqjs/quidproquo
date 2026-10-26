import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { defineSecuritySmoke } from './config/defineSecuritySmoke';
import { askRunRuntimeErrorTextLeakTest } from './probes/askRunRuntimeErrorTextLeakTest';

/** Regression probes from the security audit, one per checklist item. Each calls the deployed surface the way an attacker would and asserts the platform refuses or stays quiet. */
export const securitySmokeSuite: SmokeSuite = {
  defineConfig: defineSecuritySmoke,
  tests: [
    {
      name: 'securityRuntimeErrorTextLeak',
      askRun: askRunRuntimeErrorTextLeakTest,
    },
  ],
};
