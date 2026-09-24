import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { askRunNoopTest } from './logic/askRunNoopTest';

/** Proves the harness itself: queue fan-out, result recording, run outcome. */
export const noopSmokeSuite: SmokeSuite = {
  tests: [{ name: 'noop', askRun: askRunNoopTest }],
};
