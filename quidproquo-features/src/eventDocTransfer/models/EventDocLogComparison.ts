/** Result of findEventDocLogDivergence: is the existing log a prefix of the incoming one, and if not, where do they differ. */
export type EventDocLogComparison =
  | {
      diverged: false;
      // Events already present; an import writes from this index on.
      sharedCount: number;
      // The target has events beyond the incoming log, so the bundle is behind it and not importable.
      existingAhead: boolean;
    }
  | {
      diverged: true;
      atIndex: number;
    };
