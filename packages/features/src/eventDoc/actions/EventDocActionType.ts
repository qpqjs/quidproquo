/**
 * Actions a doc verb yields to read and write its own doc without knowing where it is mounted.
 * No default processor ships; each runtime registers the one that fits (web: optimistic append + POST, backend: append).
 */
export enum EventDocActionType {
  ApplyEvent = '@quidproquo-features/eventDoc/ApplyEvent',
  ApplyTransientEvent = '@quidproquo-features/eventDoc/ApplyTransientEvent',
  ReadState = '@quidproquo-features/eventDoc/ReadState',
  ReadIdentity = '@quidproquo-features/eventDoc/ReadIdentity',
}
