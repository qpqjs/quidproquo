import { scheduleImplementation } from '../implementations/schedule/scheduleImplementation';
import { DevServerPlugin } from './types/DevServerPlugin';

/**
 * Fires config-declared recurring schedules on the local clock.
 *
 * Default StopAccepting phase: the clock is an input like a port is, and it
 * has to stop producing work before the Drain phase can hope to reach empty.
 * A firing already under way is tracked in-flight, so Drain still waits for it.
 */
export const schedulePlugin: DevServerPlugin = {
  name: 'schedule ticker',
  start: scheduleImplementation,
};
