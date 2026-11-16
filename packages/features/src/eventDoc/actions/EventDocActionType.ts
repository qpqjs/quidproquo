/**
 * Actions the event doc feature yields. Most are how a doc verb reads and writes its own doc without knowing where it
 * is mounted: no default processor ships for those, each runtime registers the one that fits (web: optimistic append +
 * POST, backend: append).
 */
export enum EventDocActionType {
  ApplyEvent = '@quidproquo-features/eventDoc/ApplyEvent',
  ApplyTransientEvent = '@quidproquo-features/eventDoc/ApplyTransientEvent',
  ReadState = '@quidproquo-features/eventDoc/ReadState',
  ReadIdentity = '@quidproquo-features/eventDoc/ReadIdentity',
  // Answered from the service's config by a processor this package ships; defineAdminSettings registers it.
  ReadOwnedStoreNames = '@quidproquo-features/eventDoc/ReadOwnedStoreNames',
}
