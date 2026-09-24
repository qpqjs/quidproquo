import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { defineEventDocSmoke } from './config/defineEventDocSmoke';
import { askRunEventDocConcurrentAppendTest } from './logic/askRunEventDocConcurrentAppendTest';
import { askRunEventDocInterleavedBatchAppendTest } from './logic/askRunEventDocInterleavedBatchAppendTest';

/** Racing appends onto one event doc across lambdas must stay contiguous. */
export const eventDocSmokeSuite: SmokeSuite = {
  defineConfig: defineEventDocSmoke,
  tests: [
    {
      name: 'eventDocConcurrentAppend',
      askRun: askRunEventDocConcurrentAppendTest,
    },
    {
      name: 'eventDocInterleavedBatchAppend',
      askRun: askRunEventDocInterleavedBatchAppendTest,
    },
  ],
};
