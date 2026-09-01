import { Nullable } from 'quidproquo';

import { SmokeTestStatus } from './SmokeTestStatus';

// One registered test's entry in a run. `name` is the stable key; `id` is the
// test's 1-based position in the registry, for humans, and shifts if the
// registry is reordered, so nothing should key on it.
export type SmokeTestResult = {
  id: number;
  name: string;
  status: SmokeTestStatus;
  message: string;
  startedAt: Nullable<string>;
  finishedAt: Nullable<string>;
};
