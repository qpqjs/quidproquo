import { ConfigActionType, DeployEventStatusType, DeployEventType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askMigrationProcessDeploy } from './askMigrationProcessDeploy';

describe('askMigrationProcessDeploy', () => {
  it('runs the update path on an update status', () => {
    const result = runStory(askMigrationProcessDeploy(DeployEventType.Api, DeployEventStatusType.Update), {
      [ConfigActionType.GetGlobal]: [],
    });

    expect(result).toBeUndefined();
  });

  it('runs the create path on a create status', () => {
    const result = runStory(askMigrationProcessDeploy(DeployEventType.Api, DeployEventStatusType.Create), {
      [ConfigActionType.GetGlobal]: [],
    });

    expect(result).toBeUndefined();
  });

  it('does nothing on other statuses', () => {
    expect(runStory(askMigrationProcessDeploy(DeployEventType.Api, DeployEventStatusType.Delete))).toBeUndefined();
  });
});
