import { z } from 'zod';

import { DateISOSchema } from './DateISOSchema';
import { eventDocVersionSchema } from './EventDocVersion';

/**
 * The summary view folded from a log's identity and lifecycle events. Every field is derived, so the row can be rebuilt
 * at any time. `type` is not here: it is the store's partition key, stamped at persist time.
 */
export const eventDocSummaryViewSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  createdAt: DateISOSchema,
  updatedAt: DateISOSchema,
  deletedAt: DateISOSchema.optional(),
  createdBy: z.string(),
  updatedBy: z.string(),
  versions: z.array(eventDocVersionSchema),
  // The event this view is folded through (a version's own eventId is that version's head). The summary row's writers
  // compare it, so a view never overwrites a newer one.
  eventId: z.number(),
});

export type EventDocSummaryView = z.infer<typeof eventDocSummaryViewSchema>;

/**
 * The summary view as stored (pk=type, sk=id). A row written before the view carried `eventId` has none, which the
 * writers treat as older than anything.
 */
export type EventDocSummary = z.infer<typeof eventDocSummaryViewSchema> & { type: string };
