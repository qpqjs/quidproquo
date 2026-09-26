import { ParsedDockerPlatformSettings } from './getDockerPlatformSettings';

/**
 * `[<registry>/]qpq-<application>:<tag>`. Named by the deployment's application, not the app
 * folder, so two products built from one codebase get separate images and data volumes.
 */
export const getImageName = (applicationName: string, settings: ParsedDockerPlatformSettings): string =>
  `${settings.registry ? `${settings.registry}/` : ''}qpq-${applicationName}:${settings.tag}`;
