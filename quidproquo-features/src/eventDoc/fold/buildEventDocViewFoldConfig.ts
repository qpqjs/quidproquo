import { QpqReducer } from 'quidproquo-core';

import { EventDocBaseViewVersion } from '../definition/types/EventDocBaseViewVersion';
import { EventDocNextViewVersion } from '../definition/types/EventDocNextViewVersion';
import { EventDocDocument, EventDocEvent } from '../models';
import { EventDocEventValidators } from '../validation/types/EventDocEventValidators';
import { buildVersionRoutedReducer } from './buildVersionRoutedReducer';
import { EventDocMigrations } from './EventDocMigrations';
import { FoldEventDocLogConfig } from './foldEventDocLog';

// Structural so callers holding only one doc type's history can use it without importing the definition (a cycle).
type EventDocVersionEntry = {
  version: number;
  views: Record<string, EventDocBaseViewVersion<any> | EventDocNextViewVersion<any>>;
};

/**
 * Assemble one view's fold config from a doc type's version history: the single place versions become
 * {seed, reducer, migrations, latestVersion}. The seed always comes from the base version, since every log opens at version 1.
 */
export const buildEventDocViewFoldConfig = (
  versions: readonly EventDocVersionEntry[],
  viewName: string,
  schemaVersion: number,
  validators?: EventDocEventValidators<EventDocDocument>,
): FoldEventDocLogConfig<EventDocDocument> => {
  const [base, ...rest] = versions;

  const reducersByVersion: Record<number, QpqReducer<EventDocDocument, EventDocEvent>> = {};
  versions.forEach((version) => {
    reducersByVersion[version.version] = version.views[viewName].foldReducer;
  });

  const migrations: EventDocMigrations = {};
  rest.forEach((version) => {
    migrations[version.version] = (version.views[viewName] as EventDocNextViewVersion).migrateFromPrevious;
  });

  return {
    seed: (base.views[viewName] as EventDocBaseViewVersion).createInitialViewState(),
    reducer: buildVersionRoutedReducer(reducersByVersion),
    migrations,
    latestVersion: schemaVersion,
    validators,
  };
};
