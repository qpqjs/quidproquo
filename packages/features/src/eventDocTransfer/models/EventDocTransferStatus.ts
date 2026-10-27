/**
 * What an import would do (or did) to one doc. Only New and FastForward write unasked; Diverged and CodeConflict block;
 * Overwritten only appears after a forced apply.
 */
export enum EventDocTransferStatus {
  // No doc with this id in the target; the whole log is written.
  New = 'new',
  // The target's log is a strict prefix of the incoming one; only the missing tail is written.
  FastForward = 'fastForward',
  // The logs are identical.
  Same = 'same',
  // The shared prefix disagrees, or the target is ahead of the bundle. Blocking; the only status force applies to.
  Diverged = 'diverged',
  // A different doc of the same type in the same scope owns this code. Blocking; force cannot fix it.
  CodeConflict = 'codeConflict',
  // The target's divergent tail was backed up and discarded, then the bundle written. Apply result only.
  Overwritten = 'overwritten',
  // The bundle carries no events for this doc (only possible in a hand-edited bundle).
  Ignored = 'ignored',
}
