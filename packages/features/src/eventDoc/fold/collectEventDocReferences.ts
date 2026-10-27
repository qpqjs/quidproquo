import { EventDocDocument, EventDocEvent, EventDocLink } from '../models';
import { FoldEventDocLogConfig } from './foldEventDocLog';
import { foldEventDocLogStep } from './foldEventDocLogStep';
import { migrateEventDocDocumentTo } from './migrateEventDocDocumentTo';

/**
 * The fold config plus the collector to run at each step. (Spelled out rather than importing
 * EventDocReferenceCollector from definition/, which already imports fold/ and would form a cycle.)
 */
export type CollectEventDocReferencesConfig<TState extends EventDocDocument> = FoldEventDocLogConfig<TState> & {
  references: (view: TState) => EventDocLink[];
};

// Two links to the same doc collapse regardless of mode: the transfer takes the target's whole log either way.
const referenceKey = (link: EventDocLink): string => `${link.eventDocService}:${link.eventDocType}:${link.id}`;

/**
 * Every doc this one has ever referenced, collected at every step of the log: any past state may be rendered, so a
 * link that lived and died inside one version still counts. The collector runs against a migrated copy at the latest
 * shape; the accumulator itself stays at its natural version so later old-version events still see their own shape.
 */
export const collectEventDocReferences = <TState extends EventDocDocument>(
  events: EventDocEvent[],
  { seed, reducer, migrations, latestVersion, references }: CollectEventDocReferencesConfig<TState>,
): EventDocLink[] => {
  const seen = new Set<string>();
  const collected: EventDocLink[] = [];

  let state: EventDocDocument = { ...seed };

  for (const event of events) {
    [state] = foldEventDocLogStep(state, event, { reducer, migrations, latestVersion });

    const view = migrateEventDocDocumentTo(state, latestVersion, migrations) as TState;

    for (const link of references(view)) {
      const key = referenceKey(link);

      if (!seen.has(key)) {
        seen.add(key);
        collected.push(link);
      }
    }
  }

  return collected;
};
