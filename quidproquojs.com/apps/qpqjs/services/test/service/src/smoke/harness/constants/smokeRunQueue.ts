// The queue a smoke run is executed from, and the one message type on it.
// POST /smoke/run creates the run record and sends one message per registered
// test; the queue entry runs that single test, so the tests execute in
// parallel, the request returns at once, and polling shows real progress.
export const SMOKE_RUN_QUEUE = 'smokeRuns';
export const SMOKE_TEST_REQUESTED_MESSAGE_TYPE = 'smokeTestRequested';
