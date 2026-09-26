import { DevServerConfigOverrides, DevServerPorts } from 'quidproquo-dev-server';

import fs from 'fs';
import path from 'path';

import { getAppDirectory } from './discovery';

/** Every dev server listener, with the app's overrides applied. */
export type ResolvedDevServerPorts = Required<DevServerPorts>;

/** The ports a dev server listens on when the app sets none: api + static web, websockets, file storage secure urls. */
export const DEFAULT_DEV_SERVER_PORTS: ResolvedDevServerPorts = {
  api: 8080,
  webSocket: 8888,
  fileStorage: 3001,
};

/** Path of the app's optional dev server settings module (`apps/<app>/devServer.config.ts`). */
export const getDevServerConfigPath = (appName: string): string => path.join(getAppDirectory(appName), 'devServer.config.ts');

/**
 * The app's dev server ports: `ports` from apps/<app>/devServer.config.ts over the defaults. The
 * same numbers the running server resolves, so builds that bake or expose ports agree with it.
 * Requiring the TS module relies on the caller running with TS require hooks, as every command does.
 */
export const readDevServerPorts = (appName: string): ResolvedDevServerPorts => {
  const configPath = getDevServerConfigPath(appName);
  if (!fs.existsSync(configPath)) {
    return DEFAULT_DEV_SERVER_PORTS;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const loaded = require(configPath.replace(/\.ts$/, ''));
  const overrides = (loaded.default ?? loaded) as DevServerConfigOverrides;

  return { ...DEFAULT_DEV_SERVER_PORTS, ...overrides.ports };
};
