import { AskResponse, DeployEvent, DeployEventResponse } from '@qpqjs/core';

import { askMigrationProcessDeploy } from '../../logic/askMigrationProcessDeploy';

export function* onDeploy(event: DeployEvent): AskResponse<DeployEventResponse> {
  yield* askMigrationProcessDeploy(event.deployEventType, event.deployEventStatusType);
}
