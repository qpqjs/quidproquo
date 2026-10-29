import { ConfigActionType, DeployEventType, KeyValueStoreActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { Migration } from '../../../config/settings/migration';
import { askMigrationProcessDeployCreate } from './askMigrationProcessDeployCreate';

const apiMigration: Migration = { runtime: '/mig/api::run', deployType: DeployEventType.Api };
const webMigration: Migration = { runtime: '/mig/web::run', deployType: DeployEventType.Web };

describe('askMigrationProcessDeployCreate', () => {
  it('records every migration without queuing any to run', () => {
    const upserts: any[] = [];

    runStory(askMigrationProcessDeployCreate(), {
      [ConfigActionType.GetGlobal]: [apiMigration, webMigration],
      [KeyValueStoreActionType.Upsert]: (action: any) => {
        upserts.push(action.payload.item);
        return undefined;
      },
    });

    expect(upserts).toEqual([
      { deployType: DeployEventType.Api, srcPath: 'mig/api' },
      { deployType: DeployEventType.Web, srcPath: 'mig/web' },
    ]);
  });
});
