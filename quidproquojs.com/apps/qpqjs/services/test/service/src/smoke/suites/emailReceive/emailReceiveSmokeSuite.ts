import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { defineEmailReceiveSmoke } from './config/defineEmailReceiveSmoke';
import { askRunEmailReceiveTest } from './logic/askRunEmailReceiveTest';

/** Inbound email to our own receiving domain. Deployed only. */
export const emailReceiveSmokeSuite: SmokeSuite = {
  defineConfig: defineEmailReceiveSmoke,
  tests: [
    {
      name: 'emailReceive',
      askRun: askRunEmailReceiveTest,
      deployedOnly: true,
    },
  ],
};
