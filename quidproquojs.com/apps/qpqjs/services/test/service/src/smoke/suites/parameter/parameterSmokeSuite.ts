import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { defineParameterSmoke } from './config/defineParameterSmoke';
import { askRunParameterTest } from './logic/askRunParameterTest';

/** Reads an owned parameter. */
export const parameterSmokeSuite: SmokeSuite = {
  defineConfig: defineParameterSmoke,
  tests: [{ name: 'parameter', askRun: askRunParameterTest }],
};
