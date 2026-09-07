import { EventDocDocument } from '../models';

/** A pure single-step migration. The fold stamps schemaVersion, so a migration only transforms data fields. */
export type EventDocMigration = (state: EventDocDocument) => EventDocDocument;
