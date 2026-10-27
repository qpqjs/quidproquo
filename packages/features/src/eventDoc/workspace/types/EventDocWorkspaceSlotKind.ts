/**
 * `document` slots are backed by a collection and save pending into history; `local` slots are session-only, have no
 * identity and never save.
 */
export enum EventDocWorkspaceSlotKind {
  document = 'document',
  local = 'local',
}
