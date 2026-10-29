import { CliError } from '../lib/CliError';
import { createOutput } from '../lib/out';
import { awsPlatformDriver } from './aws';
import { dockerPlatformDriver } from './docker';
import { QpqDeployPlatform, QpqPlatformDriver } from './types';

const out = createOutput('platform');

const platformDrivers: Record<string, QpqPlatformDriver> = {
  [QpqDeployPlatform.aws]: awsPlatformDriver,
  [QpqDeployPlatform.docker]: dockerPlatformDriver,
};

export const getPlatformDriver = (platform: string): QpqPlatformDriver => {
  const driver = platformDrivers[platform];

  if (!driver) {
    throw new CliError(`Unknown deploy platform '${platform}'. Supported platforms: ${Object.keys(platformDrivers).join(', ')}`);
  }

  return driver;
};

export * from './types';
