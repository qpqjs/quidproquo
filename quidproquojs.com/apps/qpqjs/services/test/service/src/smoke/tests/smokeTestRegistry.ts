import { askRunNoopTest } from './noop/askRunNoopTest';
import { SmokeTestDefinition } from './SmokeTestDefinition';

// Every smoke test a run executes, in order. A test's id in the run record is
// its 1-based position here, so append rather than reorder where possible.
// Adding a test: one folder with its askRun<Name>Test story, one line here.
export const smokeTestRegistry: SmokeTestDefinition[] = [
  { name: 'noop', askRun: askRunNoopTest },
];
