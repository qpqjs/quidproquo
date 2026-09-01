/**
 * The order a dev-server shutdown runs in. The values ARE the order, so a new
 * phase slots in by number rather than by where it happens to sit in a list.
 *
 * The sequence is: nothing new comes in, then everything already running
 * finishes, then what it wrote goes to disk. Persist has to be last because a
 * request that lands during StopAccepting, or a projection that fires during
 * Drain, still writes - persisting before them would miss exactly the work
 * this whole sequence exists to save.
 */
export enum DevServerShutdownPhase {
  StopAccepting = 0,
  Drain = 1,
  Persist = 2,
}
