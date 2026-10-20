/** Which slot operation an error came from. */
export enum EventDocWorkspaceSlotOperation {
  validation = 'validation',
  load = 'load',
  save = 'save',
  // Pending events dropped because the stored view moved under them.
  rebase = 'rebase',
}
