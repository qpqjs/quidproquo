import { QueueEvent, QueueMessage } from 'quidproquo';

// One registered test of one run. `testName` is the registry's stable key,
// never the positional id.
export type SmokeTestRequestedPayload = {
  runId: string;
  testName: string;
};

export type SmokeTestRequestedQueueEvent = QueueEvent<
  QueueMessage<SmokeTestRequestedPayload>
>;
