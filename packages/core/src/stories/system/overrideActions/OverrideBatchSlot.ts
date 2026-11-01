import { Action, EitherActionResult } from '../../../types';

/** One slot of a cracked-open batch: the action, whether it ran here already, and that run's outcome if so. */
export type OverrideBatchSlot = {
  action: Action<any>;
  // Already processed here, so it must not be sent to the runtime again.
  alreadyProcessed: boolean;
  // Set once the slot has run, here or in the runtime batch; successful ones are unwrapped on reassembly.
  result: EitherActionResult<any> | undefined;
};
