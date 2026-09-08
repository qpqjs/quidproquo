import {
  defineApi,
  defineApplicationModule,
  defineApplicationVersion,
  defineAuthSystem,
  defineCache,
  defineDefaultRouteOptions,
  defineDns,
  defineFrontendBundleOptions,
  QPQConfig,
} from 'quidproquo';
import {
  ApiLayer,
  AwsDataStoreRemovalPolicy,
  defineAwsDataStoreRemovalPolicy,
  defineAwsServiceAccountInfo,
} from 'quidproquo-config-aws';
import {
  defineAdminSettings,
  defineAdminUserDirectory,
} from 'quidproquo-features';

import { execSync } from 'child_process';
import {
  TODO_DOMAINS,
  TODO_USER_DIRECTORY,
  TodoServiceEnum,
  todoServiceNames,
} from '@todo/constants';

const modulePrefix = 'todo';

// The deployed version tag — git sha when available, so a fresh checkout
// (or a scaffold that skipped git init) still loads.
const getVersionTag = (): string => {
  try {
    return execSync('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return 'no-git';
  }
};

// The shared config every todo service starts from — app identity, dns,
// auth, admin, api and caching. Each service's infrastructure.ts layers its
// own resources on top of this.
export const defineTodoService = (
  service: TodoServiceEnum,
  configRoot: string,
  apiBuildPath: string,
  apiLayers: ApiLayer[] = [],
  lambdaMemoryInMiB = 1024
): QPQConfig => [
  defineApplicationModule(
    modulePrefix,
    service,
    process.env.ENVIRONMENT!,
    configRoot,
    apiBuildPath,
    process.env.ACTOR_NAME
  ),

  defineApplicationVersion(`${getVersionTag()}-${new Date().toISOString()}`),

  defineDns(TODO_DOMAINS),

  defineAdminUserDirectory({
    owner: {
      module: TodoServiceEnum.Admin,
    },
  }),

  defineAuthSystem(TodoServiceEnum.Auth, TODO_USER_DIRECTORY),

  // Both todo environments deploy as docker images, so there's no
  // cross-account service map — identity comes from the environment when an
  // aws target is ever added.
  defineAwsServiceAccountInfo(
    process.env.AWS_DEFAULT_ACCOUNT!,
    process.env.AWS_DEFAULT_REGION!,
    [],
    {
      apiLayers,
      lambdaMaxMemoryInMiB: lambdaMemoryInMiB,
      logServiceName: TodoServiceEnum.Admin,

      disableLogs: [TodoServiceEnum.Admin].includes(service),
      disableLambdaWarming: true,
      instantLogs: true,
    }
  ),

  // Module-federation singletons beyond the react/quidproquo-web defaults.
  defineFrontendBundleOptions({
    sharedSingletons: ['chakra', 'zod'],
  }),

  defineApi('api'),
  defineDefaultRouteOptions('api', {
    allowedOrigins: [
      'http://localhost:3080',
      'http://localhost:3081',
      'http://localhost:3082',
      'http://localhost:3083',
      'http://localhost:3084',
      '*',
      { api: 'admin', service: TodoServiceEnum.Admin },
      { api: 'views' },
    ],
  }),

  defineCache(
    'default',
    {
      defaultTTLInSeconds: 86400,
      maxTTLInSeconds: 172800,
      minTTLInSeconds: 900,
      mustRevalidate: false,
    },
    {
      owner: {
        module: TodoServiceEnum.Shell,
      },
    }
  ),

  defineAdminSettings(TodoServiceEnum.Admin, {
    services: todoServiceNames,
    coldStorageAfterDays: 90,
  }),

  // turning this off is super painful for maintaince, dont be a nubbet.
  defineAwsDataStoreRemovalPolicy(AwsDataStoreRemovalPolicy.destroy),
];
