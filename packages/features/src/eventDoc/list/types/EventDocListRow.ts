import { EventDocDocument } from '../../models';

/**
 * One row of a list: a list view's state for one document, at the latest schema, with the collection's `type`. Every
 * list view carries the base document fields (the summary among them), so a list can always show a name and its dates;
 * what else a row holds depends on the view the list reads.
 */
export type EventDocListRow = EventDocDocument & { type: string } & Record<string, unknown>;
