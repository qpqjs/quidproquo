import { z } from 'zod/v4';

// Counts derived from a run's test entries at read time, never stored, so they
// cannot drift from the entries themselves.
export const SmokeRunSummarySchema = z.object({
  total: z.int().nonnegative().describe('Tests registered for the run'),
  completed: z.int().nonnegative().describe('Tests that have passed or failed'),
  passed: z.int().nonnegative(),
  failed: z.int().nonnegative(),
});

export type SmokeRunSummary = z.infer<typeof SmokeRunSummarySchema>;
