import { ConfigActionType, DeployEventStatusType, DeployEventType, KeyValueStoreActionType, QueueActionType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { Migration } from '../../../config/settings/migration';
import { askProcessOnDeployCreate, askProcessOnDeployUpdate, onDeploy } from './onDeployLogic';

const apiMigration: Migration = { runtime: '/mig/api::run', deployType: DeployEventType.Api };
const webMigration: Migration = { runtime: '/mig/web::run', deployType: DeployEventType.Web };

describe('askProcessOnDeployCreate', () => {
  it('records every migration without queuing any to run', () => {
    const upserts: any[] = [];

    runStory(askProcessOnDeployCreate(), {
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

describe('askProcessOnDeployUpdate', () => {
  it('queues and records migrations that have not run yet for the deploy type', () => {
    const messages: any[] = [];
    const upserts: any[] = [];

    runStory(askProcessOnDeployUpdate(DeployEventType.Api), {
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
    const result = runStory(askProcessOnDeployUpdate(DeployEventType.Api), {
      [ConfigActionType.GetGlobal]: [apiMigration],
      [KeyValueStoreActionType.Query]: { items: [{ srcPath: 'mig/api' }] },
    });

    expect(result).toBeUndefined();
  });
});

describe('onDeploy', () => {
  it('runs the update path on an update status', () => {
    const result = runStory(onDeploy(DeployEventType.Api, DeployEventStatusType.Update), {
      [ConfigActionType.GetGlobal]: [],
    });

    expect(result).toBeUndefined();
  });

  it('runs the create path on a create status', () => {
    const result = runStory(onDeploy(DeployEventType.Api, DeployEventStatusType.Create), {
      [ConfigActionType.GetGlobal]: [],
    });

    expect(result).toBeUndefined();
  });

  it('does nothing on other statuses', () => {
    expect(runStory(onDeploy(DeployEventType.Api, DeployEventStatusType.Delete))).toBeUndefined();
  });
});
