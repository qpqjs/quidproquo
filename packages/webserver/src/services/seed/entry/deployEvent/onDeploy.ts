import { AskResponse, DeployEvent, DeployEventResponse } from 'quidproquo-core';

import * as onDeployLogic from '../../logic/onDeployLogic';

export function* onDeploy(event: DeployEvent): AskResponse<DeployEventResponse> {
  yield* onDeployLogic.onDeploy(event.deployEventType, event.deployEventStatusType);
}
