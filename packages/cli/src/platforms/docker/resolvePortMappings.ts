import { getDefaultPortMappings } from './getDefaultPortMappings';
import { ParsedDockerPlatformSettings } from './getDockerPlatformSettings';
import { assertContainerPorts, PortMapping } from './parsePortMappings';

/**
 * The host:container pairs to run the image with: the deployment's own, or one per container
 * port plus 80 for the site. Throws, naming the deployment, when a mapping targets a port the
 * image does not listen on.
 */
export const resolvePortMappings = (
  deploymentName: string,
  settings: ParsedDockerPlatformSettings,
  apiPort: number,
  containerPorts: number[],
): PortMapping[] => {
  const portMappings = settings.portMappings ?? getDefaultPortMappings(apiPort, containerPorts);
  try {
    assertContainerPorts(portMappings, containerPorts);
  } catch (error) {
    throw new Error(`Invalid docker deployment '${deploymentName}': ${error instanceof Error ? error.message : String(error)}`);
  }
  return portMappings;
};
