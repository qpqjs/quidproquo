import { FileStorageConfig } from 'quidproquo-actionprocessor-node';
import { QPQConfig, QpqFunctionRuntime } from 'quidproquo-core';

import { DevServerPorts } from './DevServerPorts';

// Optional file storage config for input
export interface OptionalFileStorageConfig {
  storagePath?: string;
  secureUrlPort?: number;
  // Port browsers reach the secure url server on, when a host maps it differently (docker). Default: secureUrlPort.
  secureUrlPublicPort?: number;
  secureUrlHost?: string;
  secureUrlSecret?: string;
}

export type DevServerDelayConfig = number | { default?: number; [actionType: string]: number | undefined };

// Input config with optional file storage
export type DevServerConfig = {
  serverDomain: 'localhost';
  serverPort: number;
  webSocketPort?: number;

  // Base path for all dev server files, default: '.qpq-runtime'
  runtimePath?: string;

  dynamicModuleLoader: <T = any>(serviceName: string, modulePath: QpqFunctionRuntime) => Promise<T>;
  qpqConfigs: QPQConfig[];

  // File storage configuration (optional)
  fileStorageConfig?: OptionalFileStorageConfig;

  // Serve pre-built web from this directory (the docker platform image). Every web entry's
  // files sit at <webRoot>/entries/<svc>/<entry>: an entry with a port in its service's
  // defineDevServerOptions gets its own listener, the rest are served on the api port by
  // domain (root-domain entry at /, others at /<subdomain>). Unknown GET paths fall back to
  // the root entry's index (SPA).
  webRoot?: string;

  // Service name to use for logging (optional)
  logServiceName?: string;

  // Artificial latency added before each action processor runs.
  // Number = same ms for all actions; map = per-action-type with optional `default` fallback.
  delay?: DevServerDelayConfig;
};

// Resolved config with required file storage
export type ResolvedDevServerConfig = {
  serverDomain: 'localhost';
  serverPort: number;
  webSocketPort?: number;
  runtimePath: string;

  dynamicModuleLoader: <T = any>(serviceName: string, modulePath: QpqFunctionRuntime) => Promise<T>;
  qpqConfigs: QPQConfig[];

  // File storage configuration (required with all defaults filled)
  fileStorageConfig: FileStorageConfig;

  // Serve pre-built views from this directory (see DevServerConfig.webRoot).
  webRoot?: string;

  // Service name to use for logging (optional)
  logServiceName?: string;

  // Pass-through of DevServerConfig.delay; resolved at processor-wrap time.
  delay?: DevServerDelayConfig;
};

/** What `apps/<app>/devServer.config.ts` may export: the app's ports and extra QPQ config for local runs. */
export type DevServerConfigOverrides = {
  ports?: DevServerPorts;
  allServices?: QPQConfig;
  byService?: {
    [key: string]: QPQConfig;
  };
};
