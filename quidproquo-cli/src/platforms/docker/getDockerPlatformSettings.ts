import { QpqAppDeployment } from 'quidproquo-core';

import { CONTAINER_PORTS } from './CONTAINER_PORTS';
import { getDefaultPortMappings } from './getDefaultPortMappings';
import { assertContainerPorts, parsePortMappings, PortMapping } from './parsePortMappings';

export type ResolvedDockerPlatformSettings = {
  portMappings: PortMapping[];
};

/** The docker entry's platform settings with defaults applied; throws for a bad port mapping, naming the deployment. */
export const getDockerPlatformSettings = (deploymentName: string, deployment: QpqAppDeployment): ResolvedDockerPlatformSettings => {
  const raw = deployment.platformSettings?.portMappings;
  try {
    const portMappings = raw === undefined ? getDefaultPortMappings(CONTAINER_PORTS) : parsePortMappings(raw);
    assertContainerPorts(portMappings, CONTAINER_PORTS);
    return { portMappings };
  } catch (error) {
    throw new Error(`Invalid docker deployment '${deploymentName}': ${error instanceof Error ? error.message : String(error)}`);
  }
};
