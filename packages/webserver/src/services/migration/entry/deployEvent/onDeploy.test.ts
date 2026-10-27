import { ConfigActionType, DeployEvent, DeployEventStatusType, DeployEventType, KeyValueStoreActionType, runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { Migration } from '../../../../config/settings/migration';
import { onDeploy } from './onDeploy';

describe('migration deployEvent onDeploy', () => {
  it('delegates the deploy event to the migration logic', () => {
    const migration: Migration = { runtime: '/mig/api::run', deployType: DeployEventType.Api };
    const event: DeployEvent = { deployEventType: DeployEventType.Api, deployEventStatusType: DeployEventStatusType.Create };

    const upserts: any[] = [];

    runStory(onDeploy(event), {
      [ConfigActionType.GetGlobal]: [migration],
      [KeyValueStoreActionType.Upsert]: (action: any) => {
        upserts.push(action.payload.item);
        return undefined;
      },
    });

    expect(upserts).toEqual([{ deployType: DeployEventType.Api, srcPath: 'mig/api' }]);
  });
});
