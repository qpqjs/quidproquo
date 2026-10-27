import { QpqAppDeployment } from 'quidproquo-core';

import { Mount, parseMounts } from './parseMounts';
import { parsePortMappings, PortMapping } from './parsePortMappings';

export type ParsedDockerPlatformSettings = {
  // Absent when the deployment sets no `portMappings`; the defaults depend on the app's config.
  portMappings?: PortMapping[];
  registry?: string;
  arch?: string;
  tag: string;
  publicHost?: string;
  dataPath?: string;
  // Absent when the deployment mounts nothing beyond its state directory.
  mounts?: Mount[];
};

const asOptionalString = (deploymentName: string, name: string, value: unknown): string | undefined => {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Invalid docker deployment '${deploymentName}': platformSettings.${name} must be a non-empty string`);
  }
  return value.trim().replace(/\/+$/, '');
};

/** The docker entry's platform settings, parsed; throws for a malformed value, naming the deployment. */
export const getDockerPlatformSettings = (deploymentName: string, deployment: QpqAppDeployment): ParsedDockerPlatformSettings => {
  const settings = deployment.platformSettings ?? {};

  let portMappings: PortMapping[] | undefined;
  let mounts: Mount[] | undefined;
  try {
    portMappings = settings.portMappings === undefined ? undefined : parsePortMappings(settings.portMappings);
    mounts = settings.mounts === undefined ? undefined : parseMounts(settings.mounts);
  } catch (error) {
    throw new Error(`Invalid docker deployment '${deploymentName}': ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    portMappings,
    registry: asOptionalString(deploymentName, 'registry', settings.registry),
    arch: asOptionalString(deploymentName, 'arch', settings.arch),
    tag: asOptionalString(deploymentName, 'tag', settings.tag) ?? deployment.environment,
    publicHost: asOptionalString(deploymentName, 'publicHost', settings.publicHost),
    dataPath: asOptionalString(deploymentName, 'dataPath', settings.dataPath),
    mounts,
  };
};
