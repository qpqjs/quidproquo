import { Nullable } from 'quidproquo-core';

import { buildEventDocViewFoldConfig } from '../fold/buildEventDocViewFoldConfig';
import { collectEventDocReferences } from '../fold/collectEventDocReferences';
import { foldEventDocLog, foldEventDocLogAccepted, foldEventDocLogAsWritten, FoldEventDocLogConfig } from '../fold/foldEventDocLog';
import { migrateEventDocDocumentTo } from '../fold/migrateEventDocDocumentTo';
import { EventDocDocument, EventDocEvent, EventDocSnapshotViews, EventDocSummaryView } from '../models';
import { applyEventDocSummaryEvent } from '../summary/applyEventDocSummaryEvent';
import { foldEventDocSummary } from '../summary/foldEventDocSummary';
import { createEventDocEventValidator } from '../validation/createEventDocEventValidator';
import { reservedEventDocEventValidators } from '../validation/reservedEventDocEventValidators';
import { EventDocWorkspaceSlotKind } from '../workspace/types/EventDocWorkspaceSlotKind';
import { EventDocWorkspaceStoryApi } from '../workspace/types/EventDocWorkspaceStoryApi';
import { EventDocDefinition, EventDocUnsavedDefinition, EventDocView } from './types/EventDocDefinition';
import { EventDocSavedDefinitionConfig, EventDocUnsavedDefinitionConfig } from './types/EventDocDefinitionConfig';
import { EVENT_DOC_PRIMARY_VIEW, EVENT_DOC_SUMMARY_VIEW } from './types/EventDocLatestViews';
import { EventDocVersions } from './types/EventDocVersion';
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

  const { saved: _saved, api, versions, schemaVersion, references, coalesceEventTypes, storeName, type } = config;

  assertEventDocVersions(versions, schemaVersion);

  // Identity is both-or-neither: config reads {storeName, type} off the definition, and half an identity cannot resolve its stores.
  if (!storeName !== !type) {
    throw new Error(
      `event doc definition sets ${storeName ? 'storeName' : 'type'} without ${storeName ? 'type' : 'storeName'} - set both or neither.`,
    );
  }

  // The reserved guard is always merged in, even when the doc declares no rules of its own; without it, edits made
  // after publish would fold on any doc with an empty registry.
  const validators = { ...reservedEventDocEventValidators, ...(config.validators ?? {}) };

  // The primary view is the acceptance gate: every other view folds exactly the set it accepted, so views never disagree.
  const primaryFoldConfig = buildEventDocViewFoldConfig(versions, EVENT_DOC_PRIMARY_VIEW, schemaVersion, validators);

  // Every doc gets a summary view: the fold of the reserved lifecycle events only, so it needs no version entries or migrations.
  const views: Record<string, EventDocView<unknown>> = {
    [EVENT_DOC_SUMMARY_VIEW]: {
      fold: (events: EventDocEvent[]) => foldEventDocSummary(foldEventDocLogAccepted(events, primaryFoldConfig).accepted),
    },
  };

  // Shared by the live views and the snapshot fold so the two cannot drift.
  const secondaryFoldConfigs: Record<string, FoldEventDocLogConfig<EventDocDocument>> = {};

  Object.keys(versions[0].views).forEach((viewName) => {
    if (viewName === EVENT_DOC_SUMMARY_VIEW) {
      throw new Error(
        `'${EVENT_DOC_SUMMARY_VIEW}' is a built-in view name — every event doc has one, folded from the reserved lifecycle events. Remove it from \`views\`, or name the domain-specific projection something else.`,
      );
    }

    if (viewName === EVENT_DOC_PRIMARY_VIEW) {
      views[viewName] = { fold: (events: EventDocEvent[]) => foldEventDocLog(events, primaryFoldConfig) };
      return;
    }

    // No validators here: the rules ran once on the gate, and a domain rule was never written against this view's shape.
    const foldConfig = buildEventDocViewFoldConfig(versions, viewName, schemaVersion);
    secondaryFoldConfigs[viewName] = foldConfig;
    views[viewName] = {
      fold: (events: EventDocEvent[]) => foldEventDocLog(foldEventDocLogAccepted(events, primaryFoldConfig).accepted, foldConfig),
    };
  });

  // Every view of one log prefix, era-pinned (no climb to latest): what a snapshot stores. With `seedViews` (a previous
  // snapshot), `events` is only the gap since it and every view resumes from its own seed. Returns null when the seed
  // lacks a current view (one added since it was written); the caller then folds from scratch.
  const foldSnapshotViews = (events: EventDocEvent[], seedViews?: EventDocSnapshotViews): Nullable<EventDocSnapshotViews> => {
    const viewNames = [EVENT_DOC_PRIMARY_VIEW, EVENT_DOC_SUMMARY_VIEW, ...Object.keys(secondaryFoldConfigs)];

    if (seedViews && viewNames.some((viewName) => !(viewName in seedViews))) {
      return null;
    }

    // Seed states are stored untyped; these same folds wrote them, so the casts restate provenance.
    const primarySeed = seedViews ? { ...primaryFoldConfig, seed: seedViews[EVENT_DOC_PRIMARY_VIEW] as EventDocDocument } : primaryFoldConfig;
    const { state, accepted } = foldEventDocLogAsWritten(events, primarySeed);

    const snapshotViews: EventDocSnapshotViews = {
      [EVENT_DOC_PRIMARY_VIEW]: state,
      [EVENT_DOC_SUMMARY_VIEW]: seedViews
        ? accepted.reduce(applyEventDocSummaryEvent, seedViews[EVENT_DOC_SUMMARY_VIEW] as EventDocSummaryView)
        : foldEventDocSummary(accepted),
    };

    Object.entries(secondaryFoldConfigs).forEach(([viewName, foldConfig]) => {
      const viewSeed = seedViews ? { ...foldConfig, seed: seedViews[viewName] as EventDocDocument } : foldConfig;
      snapshotViews[viewName] = foldEventDocLogAsWritten(accepted, viewSeed).state;
    });

    return snapshotViews;
  };

  // The document view at one point, latest-shaped. `seedState` must be an era-pinned stored state (a snapshot's
  // document view), never a pre-migrated one: the as-written fold reads the seed's schemaVersion as the floor.
  const foldDocumentState = (events: EventDocEvent[], seedState?: unknown): unknown => {
    const seeded = seedState !== undefined ? { ...primaryFoldConfig, seed: seedState as EventDocDocument } : primaryFoldConfig;
    const { state } = foldEventDocLogAsWritten(events, seeded);

    return migrateEventDocDocumentTo(state, schemaVersion, primaryFoldConfig.migrations);
  };

  // The editor's pre-flight, derived from the same rules the fold applies. Runs against the folded live state, never the raw log.
  const validate = createEventDocEventValidator(config.validators ?? {});

  return {
    storeName,
    type,
    // TODO: This seems like the wrong place for a workspace slot kind...
    // likely should be defined at the workspace, when we define the slots.
    kind: EventDocWorkspaceSlotKind.document,
    // The workspace mounts the primary view: an editor edits a document, never a summary.
    foldReducer: primaryFoldConfig.reducer,
    // Latest-shaped, unlike the fold's own seed: the workspace hands this straight to selectors for a pristine slot.
    createInitialViewState: () => migrateEventDocDocumentTo(primaryFoldConfig.seed, schemaVersion, primaryFoldConfig.migrations),
    schemaVersion,
    migrations: primaryFoldConfig.migrations,
    coalesceEventTypes,
    validators,
    validate,
    // The same validator serves editor pre-flight, append pre-write and fold acceptance.
    validateEvent: validate,
    api: withGenericVerbs(api),
    views,
    foldSnapshotViews,
    foldDocumentState,
    references,
    // Events walk: every link any historical state referenced (transfer export). State walk: what the current document references.
    collectReferences: (events: EventDocEvent[]) => (references ? collectEventDocReferences(events, { ...primaryFoldConfig, references }) : []),
    collectReferencesFromState: (state: unknown) => (references ? references(state as never) : []),
  };
}
