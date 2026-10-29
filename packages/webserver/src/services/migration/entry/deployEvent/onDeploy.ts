import { AskResponse, DeployEvent, DeployEventResponse } from '@qpqjs/core';

import * as onDeployLogic from '../../logic/onDeployLogic';

export function* onDeploy(event: DeployEvent): AskResponse<DeployEventResponse> {
  yield* onDeployLogic.askMigrationProcessDeploy(event.deployEventType, event.deployEventStatusType);
}
