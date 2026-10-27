import { AskResponse } from 'quidproquo-core';

import { CloudflareDnsDeployEvent, CloudflareDnsDeployEventResponse } from '../../../../types';
import { askProcessCloudflareDnsDeployEvent } from '../../logic/askProcessCloudflareDnsDeployEvent';

export function* onDeploy(event: CloudflareDnsDeployEvent): AskResponse<CloudflareDnsDeployEventResponse> {
  yield* askProcessCloudflareDnsDeployEvent(event);
}
