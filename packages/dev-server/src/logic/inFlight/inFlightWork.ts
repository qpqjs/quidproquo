// Work the dev server has already accepted and is still running. The event bus
// is fire-and-forget (emit does not await its listeners), which is right for
// emulating a queue but leaves nothing any way to know when the work is done.
//
// Two callers need to know. `qpq migrate` has to, or it exits mid-migration
// and reports success. And shutdown has to, or a save-triggered restart kills
// a queue message, a kvs-stream projection or a storage-drive handler that a
// story was already told had succeeded.
const inFlight = new Set<Promise<void>>();

/**
 * Register a promise as in-flight until it settles, and hand the caller back
 * the ORIGINAL promise so tracking is invisible to them.
 *
 * The `.then` with both arms handled is what makes the tracked promise unable
 * to reject: the caller owns the failure, and a rejection escaping here would
 * surface as an unhandled rejection (fatal on Node 15+) or reject the
 * `Promise.all` in awaitDevServerIdle, neither of which is this file's call to
 * make. Set.delete cannot throw either, so nothing derived from `tracked` can
 * reject and there is no floating promise to have to mark.
 *
 * `tracked` referring to itself inside its own cleanup is fine: the callback
 * only runs in a microtask, well after the binding is initialised, and the
 * synchronous `add` below therefore always precedes any `delete`.
 */
export const trackInFlight = <T>(work: Promise<T>): Promise<T> => {
  const tracked = work
    .then(
      () => {},
      () => {},
    )
    .finally(() => inFlight.delete(tracked));

  inFlight.add(tracked);

  return work;
};

/**
 * Resolve once nothing is being processed.
 *
 * Loops rather than awaiting once, because a message can enqueue more work
 * while it runs and the set can refill after the first await settles. Draining
 * to empty is the only honest answer to "is it finished".
 */
export const awaitDevServerIdle = async (): Promise<void> => {
  while (inFlight.size > 0) {
    await Promise.all([...inFlight]);
  }
};
