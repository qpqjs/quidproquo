// The queue a smoke run is executed from, and the one message type on it.
// POST /smoke/run creates the run record and sends this message; the queue
// entry picks it up and runs the registered tests, so the request returns at
// once and polling shows real progress.
export const SMOKE_RUN_QUEUE = 'smokeRuns';
export const SMOKE_RUN_REQUESTED_MESSAGE_TYPE = 'smokeRunRequested';
