import { z } from 'zod/v4';

import { SmokeRunStatus } from './SmokeRunStatus';
import { SmokeTestResultSchema } from './SmokeTestResult';

// One smoke run: POST /smoke/run creates it, GET /smoke/run/{runId} polls it.
// The shape is the part-2 contract; part 3 only grows what `tests` contains.
export const SmokeRunSchema = z.object({
  runId: z.string(),
  status: z.enum(SmokeRunStatus),
  startedAt: z.iso.datetime(),
  finishedAt: z.iso.datetime().nullable(),
  tests: z.array(SmokeTestResultSchema),
});

export type SmokeRun = z.infer<typeof SmokeRunSchema>;
