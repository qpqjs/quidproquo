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
});

export type EventDocSummaryView = z.infer<typeof eventDocSummaryViewSchema>;

/** The summary view as stored (pk=type, sk=id). */
export const eventDocSummarySchema = eventDocSummaryViewSchema.extend({
  type: z.string(),
});

export type EventDocSummary = z.infer<typeof eventDocSummarySchema>;
