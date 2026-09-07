// Snapshots-table name derived by convention so a collection needs only one storeName —
// same scheme as eventDocEventsStoreName. The suffix is short deliberately: store names
// are compounded into physical resource names (table + stream + handler ids) that carry
// the app, environment and service on top, and a long form pushes real deployments into
// name-length limits. It was "SS" while snapshots were keyed by string event ids; the
// move to numeric ids changed the sort-key type, which a deployed table cannot do in
// place, so the name changed with it and the old table is simply dropped (snapshots are
// a disposable projection of the log).
export const eventDocSnapshotsStoreName = (storeName: string): string => `${storeName}Snap`;
