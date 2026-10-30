import { AskResponse, DeployEventStatusType, DeployEventType } from '@qpqjs/core';

import { askSeedProcessDeployCreate } from './askSeedProcessDeployCreate';

// Seeds run once, when this service's own api stack is first created. The deploy rule
// delivers every stack status change in the account, so the deploy type has to be
// checked too: a stranger's or the web stack's CREATE_COMPLETE must not re-seed.
export function* askSeedProcessDeploy(deployEventType: DeployEventType, deployEventStatusType: DeployEventStatusType): AskResponse<void> {
  if (deployEventType === DeployEventType.Api && deployEventStatusType === DeployEventStatusType.Create) {
    yield* askSeedProcessDeployCreate();
  }
}
