import { z } from 'zod/v4';

import { SmokeRunSchema } from './SmokeRun';
import { SmokeRunSummarySchema } from './SmokeRunSummary';

// What GET /smoke/run/{runId} returns: the stored run plus derived counts.
export const SmokeRunWithSummarySchema = SmokeRunSchema.extend({
  summary: SmokeRunSummarySchema,
});

export type SmokeRunWithSummary = z.infer<typeof SmokeRunWithSummarySchema>;
