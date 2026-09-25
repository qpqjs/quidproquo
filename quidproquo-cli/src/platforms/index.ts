import { awsPlatformDriver } from './aws';
import { dockerPlatformDriver } from './docker';
import { QpqDeployPlatform, QpqPlatformDriver } from './types';

const platformDrivers: Record<string, QpqPlatformDriver> = {
  [QpqDeployPlatform.aws]: awsPlatformDriver,
  [QpqDeployPlatform.docker]: dockerPlatformDriver,
};

export const getPlatformDriver = (platform: string): QpqPlatformDriver => {
  const driver = platformDrivers[platform];

  if (!driver) {
    console.error(`Unknown deploy platform '${platform}'. Supported platforms: ${Object.keys(platformDrivers).join(', ')}`);
    process.exit(1);
  }

  return driver;
};

export * from './types';
