import { QpqAppDeployment } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getDockerPlatformSettings } from './getDockerPlatformSettings';

const deployment = (platformSettings: Record<string, unknown>): QpqAppDeployment =>
  ({ platform: 'docker', name: 'app', environment: 'local', platformSettings }) as unknown as QpqAppDeployment;

describe('getDockerPlatformSettings', () => {
  it('defaults the tag to the environment and leaves the rest unset', () => {
    expect(getDockerPlatformSettings('local', deployment({}))).toEqual({
      portMappings: undefined,
      registry: undefined,
      arch: undefined,
      tag: 'local',
      publicHost: undefined,
      dataPath: undefined,
    });
  });

  it('parses every setting, trimming trailing slashes', () => {
    const settings = {
      portMappings: '80:8080',
      registry: '192.168.8.88:5000/',
      arch: 'linux/amd64',
      tag: 'latest',
      publicHost: '192.168.8.88',
      dataPath: '/mnt/user/appdata/qpq-app/',
    };

    expect(getDockerPlatformSettings('local', deployment(settings))).toEqual({
      portMappings: [{ host: 80, container: 8080 }],
      registry: '192.168.8.88:5000',
      arch: 'linux/amd64',
      tag: 'latest',
      publicHost: '192.168.8.88',
      dataPath: '/mnt/user/appdata/qpq-app',
    });
  });

  it('names the deployment for a bad value', () => {
    expect(() => getDockerPlatformSettings('local', deployment({ registry: '' }))).toThrow(
      "Invalid docker deployment 'local': platformSettings.registry must be a non-empty string",
    );
    expect(() => getDockerPlatformSettings('local', deployment({ portMappings: 'nope' }))).toThrow(
      "Invalid docker deployment 'local': Port mapping 'nope'",
    );
  });
});
