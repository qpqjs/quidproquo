import { z } from 'zod';

import { DateISOSchema } from './DateISOSchema';
import { EventDocStatus } from './EventDocStatus';
import { eventDocVersionSchema } from './EventDocVersion';

/**
 * The summary view: the base document fields every view carries, plus who created and last changed the document, its
 * publish history, and the event it is folded through. Every field is derived, so the row can be rebuilt at any time.
 * `type` is not here: it is the lists store's partition key, stamped at persist time.
 */
export const eventDocSummaryViewSchema = z.object({
  schemaVersion: z.number().int(),
  id: z.string(),
  code: z.string(),
  name: z.string(),
  documentVersion: z.number().int(),
  status: z.nativeEnum(EventDocStatus),
  createdAt: DateISOSchema,
  updatedAt: DateISOSchema,
  deletedAt: DateISOSchema.optional(),
  deletedBy: z.string().optional(),
  recentClientMessageIds: z.array(z.string()).optional(),
  createdBy: z.string(),
  updatedBy: z.string(),
  versions: z.array(eventDocVersionSchema),
  // The last event folded into this view (a version's own eventId is that version's head).
  eventId: z.number(),
});

/** The summary view's folded state. */
export type EventDocSummaryView = z.infer<typeof eventDocSummaryViewSchema>;

/** The summary view as its readers get it: with the collection's `type` stamped on. */
export type EventDocSummary = z.infer<typeof eventDocSummaryViewSchema> & { type: string };
