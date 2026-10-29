import { DevServerShutdownPhase } from './DevServerShutdownPhase';

export type DevServerShutdownTask = {
  // Only ever used in a log line: which task failed, or what was still running
  // when its phase ran out of budget.
  name: string;

  phase: DevServerShutdownPhase;

  run: () => Promise<void>;
};
