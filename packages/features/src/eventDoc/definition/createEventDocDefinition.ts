import { Nullable } from '@qpqjs/core';

import { buildEventDocViewFoldConfig } from '../fold/buildEventDocViewFoldConfig';
import { collectEventDocReferences } from '../fold/collectEventDocReferences';
import { foldEventDocListView } from '../fold/foldEventDocListView';
import { foldEventDocLog, foldEventDocLogAccepted, foldEventDocLogAsWritten, FoldEventDocLogConfig } from '../fold/foldEventDocLog';
import { migrateEventDocDocumentTo } from '../fold/migrateEventDocDocumentTo';
import { EventDocDocument, EventDocEvent, EventDocListViewState, EventDocSnapshotViews } from '../models';
import { withEventDocSummaryView } from '../summary/logic/withEventDocSummaryView';
import { createEventDocEventValidator } from '../validation/createEventDocEventValidator';
import { reservedEventDocEventValidators } from '../validation/reservedEventDocEventValidators';
import { withEventDocSchemaVersionCeiling } from '../validation/withEventDocSchemaVersionCeiling';
import { withEventDocServerEventTypes } from '../validation/withEventDocServerEventTypes';
import { EventDocWorkspaceSlotKind } from '../workspace/types/EventDocWorkspaceSlotKind';
import { EventDocWorkspaceStoryApi } from '../workspace/types/EventDocWorkspaceStoryApi';
import { EventDocDefinition, EventDocUnsavedDefinition, EventDocView } from './types/EventDocDefinition';
import { EventDocSavedDefinitionConfig, EventDocUnsavedDefinitionConfig } from './types/EventDocDefinitionConfig';
import { EVENT_DOC_PRIMARY_VIEW, EVENT_DOC_SUMMARY_VIEW } from './types/EventDocLatestViews';
import { EventDocVersions } from './types/EventDocVersion';
import { assertEventDocListViews } from './assertEventDocListViews';
import { assertEventDocVersions } from './assertEventDocVersions';
import { EventDocGenericApi, eventDocGenericApi } from './eventDocGenericApi';

// Additive only: a domain api reusing a reserved verb name throws at definition time rather than winning by merge order.
const withGenericVerbs = <TApi extends EventDocWorkspaceStoryApi>(api: TApi): TApi & EventDocGenericApi => {
  const collisions = Object.keys(eventDocGenericApi).filter((verbName) => verbName in api);

  if (collisions.length > 0) {
    throw new Error(`api redefines built-in event doc verb(s): ${collisions.join(', ')} - remove them; every saved doc gets them automatically.`);
  }

  return { ...api, ...eventDocGenericApi };
};

/**
 * The canonical home of a doc type: its version history folded into one view per projection, plus its own api,
 * mountable verbatim as a workspace slot. `saved: false` gives a session-only stream with no log, versions or lifecycle.
 */
export function createEventDocDefinition<const TVersions extends EventDocVersions, TApi extends EventDocWorkspaceStoryApi>(
  config: EventDocSavedDefinitionConfig<TVersions, TApi>,
): EventDocDefinition<TVersions, TApi>;
export function createEventDocDefinition<TView, TApi extends EventDocWorkspaceStoryApi>(
  config: EventDocUnsavedDefinitionConfig<TView, TApi>,
): EventDocUnsavedDefinition<TView, TApi>;
export function createEventDocDefinition(
  config:
    EventDocSavedDefinitionConfig<EventDocVersions, EventDocWorkspaceStoryApi> | EventDocUnsavedDefinitionConfig<unknown, EventDocWorkspaceStoryApi>,
): unknown {
  if (config.saved === false) {
    const { saved: _saved, ...slotConfig } = config;

    return {
      kind: EventDocWorkspaceSlotKind.local,
      ...slotConfig,
    };
  }

  const { saved: _saved, api, versions, schemaVersion, references, coalesceEventTypes, storeName, type, sync } = config;
  const serverEventTypes = [...(config.serverEventTypes ?? [])];

  assertEventDocVersions(versions, schemaVersion);
  assertEventDocListViews(config.listViews ?? [], Object.keys(versions[0].views), type);

  // The summary is declared for every doc type, at every version, and is always a list view.
  const allVersions = withEventDocSummaryView(versions);
  const listViewNames: string[] = [EVENT_DOC_SUMMARY_VIEW, ...(config.listViews ?? [])];

  // Identity is both-or-neither: config reads {storeName, type} off the definition, and half an identity cannot resolve its stores.
  if (!storeName !== !type) {
    throw new Error(
      `event doc definition sets ${storeName ? 'storeName' : 'type'} without ${storeName ? 'type' : 'storeName'} - set both or neither.`,
    );
  }

  if (sync && !storeName) {
    throw new Error('event doc definition sets sync without an identity - a client-only definition has nothing to push.');
  }

  // The reserved guard is always merged in, even when the doc declares no rules of its own; without it, edits made
  // after publish would fold on any doc with an empty registry.
  const validators = { ...reservedEventDocEventValidators, ...(config.validators ?? {}) };

  // The primary view is the acceptance gate: every other view folds exactly the set it accepted, so views never disagree.
  const primaryFoldConfig = buildEventDocViewFoldConfig(versions, EVENT_DOC_PRIMARY_VIEW, schemaVersion, validators);

  const views: Record<string, EventDocView<unknown>> = {
    [EVENT_DOC_PRIMARY_VIEW]: { fold: (events: EventDocEvent[]) => foldEventDocLog(events, primaryFoldConfig) },
  };

  // Shared by the live views and the snapshot fold so the two cannot drift. The summary is one of these.
  const secondaryFoldConfigs: Record<string, FoldEventDocLogConfig<EventDocDocument>> = {};

  Object.keys(allVersions[0]?.views ?? {})
    .filter((viewName) => viewName !== EVENT_DOC_PRIMARY_VIEW)
    .forEach((viewName) => {
      // No validators here: the rules ran once on the gate, and a domain rule was never written against this view's shape.
      const foldConfig = buildEventDocViewFoldConfig(allVersions, viewName, schemaVersion);
      secondaryFoldConfigs[viewName] = foldConfig;
      views[viewName] = {
        fold: (events: EventDocEvent[]) => foldEventDocLog(foldEventDocLogAccepted(events, primaryFoldConfig).accepted, foldConfig),
      };
    });

  // Every view of one log prefix, era-pinned (no climb to latest): what a snapshot stores. With `seedViews` (a previous
  // snapshot), `events` is only the gap since it and every view resumes from its own seed. Returns null when the seed
  // lacks a current view (one added since it was written) or holds one that is not a folded view state (a snapshot
  // from before the summary was an ordinary view); the caller then folds from scratch.
  const foldSnapshotViews = (events: EventDocEvent[], seedViews?: EventDocSnapshotViews): Nullable<EventDocSnapshotViews> => {
    const viewNames = [EVENT_DOC_PRIMARY_VIEW, ...Object.keys(secondaryFoldConfigs)];

    if (seedViews && viewNames.some((viewName) => typeof (seedViews[viewName] as Nullable<EventDocDocument>)?.schemaVersion !== 'number')) {
      return null;
    }

    // Seed states are stored untyped; these same folds wrote them, so the casts restate provenance.
    const primarySeed = seedViews ? { ...primaryFoldConfig, seed: seedViews[EVENT_DOC_PRIMARY_VIEW] as EventDocDocument } : primaryFoldConfig;
    const { state, accepted } = foldEventDocLogAsWritten(events, primarySeed);

    const snapshotViews: EventDocSnapshotViews = {
      [EVENT_DOC_PRIMARY_VIEW]: state,
    };

    Object.entries(secondaryFoldConfigs).forEach(([viewName, foldConfig]) => {
      const viewSeed = seedViews ? { ...foldConfig, seed: seedViews[viewName] as EventDocDocument } : foldConfig;
      snapshotViews[viewName] = foldEventDocLogAsWritten(accepted, viewSeed).state;
    });

    return snapshotViews;
  };

  // A doc type's own rules read the document, so a list view cannot judge untrusted events against them from its row.
  const hasDomainValidators = Object.keys(config.validators ?? {}).length > 0;

  const foldListView = (viewName: string, events: EventDocEvent[], seedState: unknown, trusted: boolean): Nullable<EventDocListViewState> => {
    const foldConfig = listViewNames.includes(viewName) ? secondaryFoldConfigs[viewName] : undefined;

    if (!foldConfig || (hasDomainValidators && !trusted)) {
      return null;
    }

    return foldEventDocListView(foldConfig, events, seedState, trusted);
  };

  const migrateListViewStates = (viewName: string, states: unknown[]): unknown[] => {
    const foldConfig = secondaryFoldConfigs[viewName];

    return foldConfig ? states.map((state) => migrateEventDocDocumentTo(state as EventDocDocument, schemaVersion, foldConfig.migrations)) : states;
  };

  // The document view at one point, latest-shaped. `seedState` must be an era-pinned stored state (a snapshot's
  // document view), never a pre-migrated one: the as-written fold reads the seed's schemaVersion as the floor.
  const foldDocumentState = (events: EventDocEvent[], seedState?: unknown): unknown => {
    const seeded = seedState !== undefined ? { ...primaryFoldConfig, seed: seedState as EventDocDocument } : primaryFoldConfig;
    const { state } = foldEventDocLogAsWritten(events, seeded);

    return migrateEventDocDocumentTo(state, schemaVersion, primaryFoldConfig.migrations);
  };

  // The domain rules as one validator, derived from the same registry the fold applies. Runs against the folded live
  // state, never the raw log.
  const domainValidate = createEventDocEventValidator(config.validators ?? {});

  // The editor's pre-flight: a client may never queue a server-only type, so it is refused here before the domain rules.
  const validate = withEventDocServerEventTypes(serverEventTypes, domainValidate);

  return {
    storeName,
    type,
    sync,
    // TODO: @joe-coady: This seems like the wrong place for a workspace slot kind...
    // likely should be defined at the workspace, when we define the slots.
    kind: EventDocWorkspaceSlotKind.document,
    // The workspace mounts the primary view: an editor edits a document, never a summary.
    foldReducer: primaryFoldConfig.reducer,
    // Latest-shaped, unlike the fold's own seed: the workspace hands this straight to selectors for a pristine slot.
    createInitialViewState: () => migrateEventDocDocumentTo(primaryFoldConfig.seed, schemaVersion, primaryFoldConfig.migrations),
    schemaVersion,
    getSnapshotCacheKey: () => config.snapshotCacheKey ?? '',
    getServerEventTypes: () => serverEventTypes,
    migrations: primaryFoldConfig.migrations,
    coalesceEventTypes,
    validators,
    validate,
    // The append pre-write gate: the domain rules under the schema-version ceiling. The fold has no reducer above
    // `schemaVersion`, and an event it cannot read must never reach the append-only log. Server-only types pass
    // here on purpose: the client refusal is decided by the append's origin, so a server append that opts into
    // validation is judged on the domain rules alone.
    validateEvent: withEventDocSchemaVersionCeiling(schemaVersion, domainValidate),
    api: withGenericVerbs(api),
    views,
    getListViewNames: () => listViewNames,
    foldListView,
    migrateListViewStates,
    foldSnapshotViews,
    foldDocumentState,
    references,
    // Events walk: every link any historical state referenced (transfer export). State walk: what the current document references.
    collectReferences: (events: EventDocEvent[]) => (references ? collectEventDocReferences(events, { ...primaryFoldConfig, references }) : []),
    collectReferencesFromState: (state: unknown) => (references ? references(state as never) : []),
  };
}
