import { z } from 'zod/v4';

import { SmokeTestStatus } from './SmokeTestStatus';

// One registered test's entry in a run. `name` is the stable key; `id` is the
// test's 1-based position in the registry, for humans, and shifts if the
// registry is reordered, so nothing should key on it.
export const SmokeTestResultSchema = z.object({
  id: z.int().positive().describe('1-based position in the test registry'),
  name: z.string().describe('Stable test name'),
  status: z.enum(SmokeTestStatus),
  message: z.string(),
  startedAt: z.iso.datetime().nullable(),
  finishedAt: z.iso.datetime().nullable(),
});

export type SmokeTestResult = z.infer<typeof SmokeTestResultSchema>;
