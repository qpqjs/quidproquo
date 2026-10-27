// THIS version's number — not the doc type's latest.
//
// The distinction matters once there is a v2: MAINTENANCE_SCHEMA_VERSION (in the doc
// type's own constants) is the latest, stamped on newly authored events and used as the
// fold's migration target. This one is 1 forever, because v1 is v1 forever. Seeding or
// registering the base version with the LATEST constant would claim the base is v8, and a
// v1-shaped seed stamped v8 would make the fold skip every migration on the way up.
export const MAINTENANCE_VERSION = 1;
