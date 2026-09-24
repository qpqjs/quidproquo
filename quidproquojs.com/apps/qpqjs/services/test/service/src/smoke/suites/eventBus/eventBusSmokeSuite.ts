import { SmokeSuite } from '../../harness/types/SmokeSuite';
import { defineEventBusSmoke } from './config/defineEventBusSmoke';
import { askRunEventBusTest } from './logic/askRunEventBusTest';

/** Publish to an owned event bus and wait for the subscribed queue's marker. */
export const eventBusSmokeSuite: SmokeSuite = {
  defineConfig: defineEventBusSmoke,
  tests: [{ name: 'eventBus', askRun: askRunEventBusTest }],
};
