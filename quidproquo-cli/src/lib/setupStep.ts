import { Nullable } from 'quidproquo-core';

export type SetupCheckResult = {
  done: boolean;
  // One line for the menu: what exists, or what is missing and how to fix it.
  detail?: string;
};

/**
 * One item of a platform's setup checklist. `check` says whether it is already in place
 * (null when it cannot tell), `run` makes it so. A check-only step (credentials, zones) has a
 * run that re-checks and throws with guidance, so a failed prerequisite stops the sequence.
 */
export type SetupStep = {
  id: string;
  name: string;
  check: () => Promise<Nullable<SetupCheckResult>>;
  run: () => Promise<void>;
};
