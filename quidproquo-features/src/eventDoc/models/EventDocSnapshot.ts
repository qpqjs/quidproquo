/**
 * One view's folded state at one event, as snapshot row data. The state is pinned to the schema version its log prefix
 * reached (a reader migrates it up). Large states live on the blob drive at eventDocSnapshotPath, derived from the row keys.
 * `views` is the manifest of every view written at this event, stamped only on the document row (written last).
 */
export type EventDocSnapshot =
  | {
      type: 'inline';
      snapshot: unknown;
      views?: string[];
    }
  | {
      type: 'storageDrive';
      views?: string[];
    };
