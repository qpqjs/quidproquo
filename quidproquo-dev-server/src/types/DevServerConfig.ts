import { FileStorageConfig } from 'quidproquo-actionprocessor-node';
import { QPQConfig, QpqFunctionRuntime } from 'quidproquo-core';

// Optional file storage config for input
export interface OptionalFileStorageConfig {
  storagePath?: string;
  secureUrlPort?: number;
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

  // Serve pre-built web from this directory (the docker platform image). Layout mirrors
  // the AWS buckets: <webRoot>/website is the module-federation host (shell) served at /,
  // <webRoot>/views/<svc> are the remotes, and <webRoot>/entries/<svc>/<entry> is every
  // other web entry, each hosted on the port from that service's defineDevServerOptions.
  // Unknown GET paths fall back to the shell's index.html (SPA).
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

export type DevServerConfigOverrides = {
  allServices?: QPQConfig;
  byService?: {
    [key: string]: QPQConfig;
  };
};
