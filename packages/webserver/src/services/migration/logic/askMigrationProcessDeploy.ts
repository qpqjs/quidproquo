import { AskResponse, DeployEventStatusType, DeployEventType } from '@qpqjs/core';

import { askMigrationProcessDeployCreate } from './askMigrationProcessDeployCreate';
import { askMigrationProcessDeployUpdate } from './askMigrationProcessDeployUpdate';

export function* askMigrationProcessDeploy(deployEventType: DeployEventType, deployEventStatusType: DeployEventStatusType): AskResponse<void> {
  if (deployEventStatusType === DeployEventStatusType.Update) {
    yield* askMigrationProcessDeployUpdate(deployEventType);
  } else if (deployEventStatusType === DeployEventStatusType.Create) {
    yield* askMigrationProcessDeployCreate();
  }
}
