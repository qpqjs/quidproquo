import { z } from 'zod';

// What POST /smoke/run returns: just the handle to poll with.
export const SmokeRunStartedSchema = z.object({
  runId: z.string().describe('Poll GET /smoke/run/{runId} with this'),
});

export type SmokeRunStarted = z.infer<typeof SmokeRunStartedSchema>;
