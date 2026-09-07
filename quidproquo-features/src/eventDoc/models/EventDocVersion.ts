import { z } from 'zod';

import { DateISOSchema } from './DateISOSchema';

/**
 * A version entry on a EventDocSummary, derived from the event log. `eventId` is the
 * log id of the version's last event — its head — always set, and advanced by every
 * appended event while it is the tail draft (a published version freezes on its PUBLISH
 * event). To fold/render a version's content, fold events with id <= `eventId`.
 * `publishedAt` is when the version was published; `effectiveFrom` is when that publish
 * takes effect (for as-of selection) — both unset while it is the tail draft.
 */
export const eventDocVersionSchema = z.object({
  version: z.number().int(),
  eventId: z.number().int(),
  publishedAt: DateISOSchema.optional(),
  effectiveFrom: DateISOSchema.optional(),
});

export type EventDocVersion = z.infer<typeof eventDocVersionSchema>;
