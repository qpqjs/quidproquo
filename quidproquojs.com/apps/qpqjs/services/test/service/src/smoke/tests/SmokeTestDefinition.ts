import { AskResponse } from 'quidproquo';

// A registered smoke test. `askRun` passes by returning and fails by throwing
// (askThrowError); the runner catches and records the error text as the message.
//
// The run id is handed to every test, and most ignore it: a test that leaves a
// mark somewhere durable stamps it, so what it later reads back is provably
// its own rather than the previous run's. Declaring the parameter costs the
// tests that do not want it nothing, since a zero-argument function still
// satisfies this.
export type SmokeTestDefinition = {
  name: string;
  askRun: (runId: string) => AskResponse<void>;
};
