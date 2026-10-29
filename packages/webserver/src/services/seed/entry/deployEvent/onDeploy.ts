import { AskResponse, DeployEvent, DeployEventResponse } from '@qpqjs/core';

import { askSeedProcessDeploy } from '../../logic/askSeedProcessDeploy';

export function* onDeploy(event: DeployEvent): AskResponse<DeployEventResponse> {
  yield* askSeedProcessDeploy(event.deployEventType, event.deployEventStatusType);
}
