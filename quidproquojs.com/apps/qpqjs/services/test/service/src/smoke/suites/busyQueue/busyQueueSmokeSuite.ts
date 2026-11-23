import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { defineBusyQueueSmoke } from './config/defineBusyQueueSmoke';
import { askRunBusyQueueTest } from './logic/askRunBusyQueueTest';

/** Send a burst to a queue whose consumer runs one at a time and wait for every message's marker. */
export const busyQueueSmokeSuite: SmokeSuite = {
  defineConfig: defineBusyQueueSmoke,
  tests: [{ name: 'busyQueue', askRun: askRunBusyQueueTest }],
};
