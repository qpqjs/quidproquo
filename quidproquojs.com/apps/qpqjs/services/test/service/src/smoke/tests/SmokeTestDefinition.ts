import { AskResponse } from 'quidproquo';

// A registered smoke test. `askRun` passes by returning and fails by throwing
// (askThrowError); the runner catches and records the error text as the message.
export type SmokeTestDefinition = {
  name: string;
  askRun: () => AskResponse<void>;
};
