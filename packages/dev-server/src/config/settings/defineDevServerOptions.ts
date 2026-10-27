import { QPQConfig, QPQConfigSetting, qpqCoreUtils } from 'quidproquo-core';

export enum QPQDevServerConfigSettingType {
  devServerOptions = '@quidproquo-dev-server/config/DevServerOptions',
}

export type DevServerViewsOptions = {
  // Port the service's views project listens on under `qpq go:dev:web`.
  port?: number;
};

export type DevServerWebEntryOptions = {
  // Port the entry is hosted on when the dev server serves pre-built web (the docker image).
  port: number;
};

/**
 * Local ports for one service. Each key names what the port is for, since a service can own
 * a views project and several web entries at once.
 */
export type DevServerOptions = {
  views?: DevServerViewsOptions;

  // Keyed by this service's `defineWebEntry` name. The shell's `website` and `views` entries
  // ride the main server port and are never listed here; every other entry needs a port to
  // be hosted at all.
  webEntries?: Record<string, DevServerWebEntryOptions>;
};

export type DevServerOptionsQPQConfigSetting = QPQConfigSetting & DevServerOptions;

export const defineDevServerOptions = (options: DevServerOptions): DevServerOptionsQPQConfigSetting => ({
  configSettingType: QPQDevServerConfigSettingType.devServerOptions,
  uniqueKey: 'DevServerOptions',

  ...options,
});

export const getDevServerOptions = (qpqConfig: QPQConfig): DevServerOptions => {
  const settings = qpqCoreUtils.getConfigSettings<DevServerOptionsQPQConfigSetting>(qpqConfig, QPQDevServerConfigSettingType.devServerOptions);

  if (settings.length > 1) {
    throw new Error('max one entry of defineDevServerOptions can be used per service');
  }

  return settings[0] ?? {};
};
