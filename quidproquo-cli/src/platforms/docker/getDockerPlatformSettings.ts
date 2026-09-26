import { QpqAppDeployment } from 'quidproquo-core';

import { parsePortMappings, PortMapping } from './parsePortMappings';

export type ParsedDockerPlatformSettings = {
  // Absent when the deployment sets no `portMappings`; the defaults depend on the app's config.
  portMappings?: PortMapping[];
};

/** The docker entry's platform settings, parsed; throws for a malformed port mapping, naming the deployment. */
export const getDockerPlatformSettings = (deploymentName: string, deployment: QpqAppDeployment): ParsedDockerPlatformSettings => {
  const raw = deployment.platformSettings?.portMappings;
  try {
    return { portMappings: raw === undefined ? undefined : parsePortMappings(raw) };
  } catch (error) {
    throw new Error(`Invalid docker deployment '${deploymentName}': ${error instanceof Error ? error.message : String(error)}`);
  }
};
