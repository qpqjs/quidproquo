import { ConfigActionType, DeployEventType, KeyValueStoreActionType, QueueActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { Migration } from '../../../config/settings/migration';
import { askMigrationProcessDeployUpdate } from './askMigrationProcessDeployUpdate';

const apiMigration: Migration = { runtime: '/mig/api::run', deployType: DeployEventType.Api };
const webMigration: Migration = { runtime: '/mig/web::run', deployType: DeployEventType.Web };

describe('askMigrationProcessDeployUpdate', () => {
  it('queues and records migrations that have not run yet for the deploy type', () => {
    const messages: any[] = [];
    const upserts: any[] = [];

    runStory(askMigrationProcessDeployUpdate(DeployEventType.Api), {
      [ConfigActionType.GetGlobal]: [apiMigration, webMigration],
      [KeyValueStoreActionType.Query]: { items: [] },
      [QueueActionType.SendMessages]: (action: any) => {
        messages.push(action.payload);
        return undefined;
      },
      [KeyValueStoreActionType.Upsert]: (action: any) => {
        upserts.push(action.payload.item);
        return undefined;
      },
    });

    expect(messages).toEqual([{ queueName: 'qpqMigrations', queueMessages: [{ type: 'mig/api', payload: undefined }] }]);
    expect(upserts).toEqual([{ deployType: DeployEventType.Api, srcPath: 'mig/api' }]);
  });

  it('skips migrations that have already run', () => {
    const result = runStory(askMigrationProcessDeployUpdate(DeployEventType.Api), {
      [ConfigActionType.GetGlobal]: [apiMigration],
      [KeyValueStoreActionType.Query]: { items: [{ srcPath: 'mig/api' }] },
    });

    expect(result).toBeUndefined();
  });
});
