import {
  defineApi,
  defineApplicationModule,
  defineApplicationVersion,
  defineAuthSystem,
  defineCache,
  defineDefaultRouteOptions,
  defineDns,
  defineEmailReceivingDomain,
  defineFrontendBundleOptions,
  getDeploySettingList,
  QPQConfig,
} from 'quidproquo';
import {
  ApiLayer,
  AwsDataStoreRemovalPolicy,
  defineAwsDataStoreRemovalPolicy,
  defineAwsServiceAccountInfo,
  defineWafProtection,
  getAwsServiceAccountInfosForDeployments,
} from 'quidproquo-config-aws';
import {
  defineAdminSettings,
  defineAdminUserDirectory,
  defineOpenApiRoutes,
} from 'quidproquo-features';

import { execSync } from 'child_process';
import {
  QPQJS_USER_DIRECTORY,
  QpqjsServiceEnum,
  qpqjsServiceNames,
} from '@qpqjs/constants';

// Identity comes from the selected deployment in deploy.config.json, primed by the CLI.
const modulePrefix = process.env.APPLICATION_NAME!;

// Deployments (by name in deploy.config.json) whose services this one may reach
// across accounts. Add a developer's feature deployment here to share with it.
const crossDeploymentNames = ['production', 'staging'];

export const defineQpqjsService = (
  service: QpqjsServiceEnum,
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
    process.env.FEATURE_NAME
  ),

  defineApplicationVersion(
    `${execSync('git rev-parse --short HEAD')
      .toString()
      .trim()}-${new Date().toISOString()}`
  ),

  // Root domains come from the deployment's ROOT_DOMAINS setting, primary first.
  defineDns(getDeploySettingList('ROOT_DOMAINS')),
  // Same domain bootstrap.qpq.ts declares: bootstrap owns the records, a service's
  // defineEmailReceiver resolves its recipients from it.
  defineEmailReceivingDomain('inbox'),

  defineAdminUserDirectory({
    owner: {
      module: QpqjsServiceEnum.Admin,
    },
  }),

  defineAuthSystem(QpqjsServiceEnum.Auth, QPQJS_USER_DIRECTORY),

  defineAwsServiceAccountInfo(
    process.env.AWS_DEFAULT_ACCOUNT!,
    process.env.AWS_DEFAULT_REGION!,

    getAwsServiceAccountInfosForDeployments(crossDeploymentNames, qpqjsServiceNames),
    {
      apiLayers,
      lambdaMaxMemoryInMiB: lambdaMemoryInMiB,
      logServiceName: QpqjsServiceEnum.Admin,

      disableLogs: [QpqjsServiceEnum.Admin].includes(service),
      disableLambdaWarming: true,
      instantLogs: true,
    }
  ),

  defineWafProtection(),

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
      '*',
      { api: 'admin', service: QpqjsServiceEnum.Admin },
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
        module: QpqjsServiceEnum.Shell,
      },
    }
  ),

  defineAdminSettings(QpqjsServiceEnum.Admin, {
    services: qpqjsServiceNames,
    coldStorageAfterDays: 90,
  }),

  // Every service documents itself: reference page at /v1/docs, the generated
  // OpenAPI document at /v1/docs/openapi.json. Public, like the docs site.
  defineOpenApiRoutes({
    info: { title: `${modulePrefix} ${service}`, version: '1.0.0' },
  }),

  // turning this off is super painful for maintaince, dont be a nubbet.
  defineAwsDataStoreRemovalPolicy(AwsDataStoreRemovalPolicy.destroy),
];
