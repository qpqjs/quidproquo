import { z } from 'zod';

import { DateISOSchema } from './DateISOSchema';

/**
 * A version entry on an EventDocSummary. `eventId` is the version's head (advances while it is the tail draft, frozen at
 * PUBLISH); fold events with id <= eventId for its content. `publishedAt`/`effectiveFrom` are unset while it is a draft.
 */
export const eventDocVersionSchema = z.object({
  version: z.number().int(),
  eventId: z.number().int(),
  publishedAt: DateISOSchema.optional(),
  effectiveFrom: DateISOSchema.optional(),
});

export type EventDocVersion = z.infer<typeof eventDocVersionSchema>;
