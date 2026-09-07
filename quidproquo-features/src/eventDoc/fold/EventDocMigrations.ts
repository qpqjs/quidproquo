import { EventDocMigration } from './EventDocMigration';

/** Single-step migrations keyed by target version: migrations[N] takes v(N-1) to vN. Must cover 2..latest; the fold throws on a gap. */
export type EventDocMigrations = Record<number, EventDocMigration>;
