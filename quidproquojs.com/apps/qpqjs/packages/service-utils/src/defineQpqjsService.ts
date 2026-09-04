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
  defineAwsServiceAccountInfo,
  defineWafProtection,
  AwsDataStoreRemovalPolicy,
  defineAwsDataStoreRemovalPolicy 
} from 'quidproquo-config-aws';
import {
  defineAdminSettings,
  defineAdminUserDirectory,
  defineOpenApiRoutes,
} from 'quidproquo-features';

import { execSync } from 'child_process';
import {
  QPQJS_DOMAIN,
  QPQJS_USER_DIRECTORY,
  QpqjsServiceEnum,
  qpqjsServiceNames,
} from '@qpqjs/constants';

const productionAccountId = '761018864142';
const stagingAccountId = '761018864142';
const developmentAccountId = '061039804449';
const modulePrefix = 'qpqjs';
const developerNames: string[] = [];

export const defineQpqjsService = (
  service: QpqjsServiceEnum,
  configRoot: string,
  apiBuildPath: string,
  apiLayers: ApiLayer[] = [],
  lambdaMemoryInMiB = 1024,
  domainName = QPQJS_DOMAIN
): QPQConfig => [
  defineApplicationModule(
    modulePrefix,
    service,
    process.env.ENVIRONMENT!,
    configRoot,
    apiBuildPath,
    process.env.ACTOR_NAME
  ),

  defineApplicationVersion(
    `${execSync('git rev-parse --short HEAD')
      .toString()
      .trim()}-${new Date().toISOString()}`
  ),

  defineDns(domainName),

  defineAdminUserDirectory({
    owner: {
      module: QpqjsServiceEnum.Admin,
    },
  }),

  defineAuthSystem(QpqjsServiceEnum.Auth, QPQJS_USER_DIRECTORY),

  defineAwsServiceAccountInfo(
    process.env.AWS_DEFAULT_ACCOUNT!,
    process.env.AWS_DEFAULT_REGION!,

    qpqjsServiceNames.flatMap((crossServiceName) => [
      {
        environment: 'production',
        moduleName: crossServiceName,
        awsAccountId: productionAccountId,
        awsRegion: process.env.AWS_DEFAULT_REGION!,
      },
      {
        environment: 'staging',
        moduleName: crossServiceName,
        awsAccountId: stagingAccountId,
        awsRegion: process.env.AWS_DEFAULT_REGION!,
      },
      ...developerNames.map((actorName) => ({
        environment: 'development',
        moduleName: crossServiceName,
        feature: actorName,
        awsAccountId: developmentAccountId,
        awsRegion: process.env.AWS_DEFAULT_REGION!,
      })),
    ]),
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

  defineApi('api', domainName),
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

  defineAdminSettings(QpqjsServiceEnum.Admin, QPQJS_DOMAIN, {
    services: qpqjsServiceNames,
    coldStorageAfterDays: 90,
  }),

  // Every service documents itself: reference page at /v1/docs, the generated
  // OpenAPI document at /v1/docs/openapi.json. Public, like the docs site.
  defineOpenApiRoutes({
    info: { title: `${modulePrefix} ${service}`, version: '1.0.0' },
  }),

  // turning this off is super painful for maintaince, dont be a nubbet.
  defineAwsDataStoreRemovalPolicy(AwsDataStoreRemovalPolicy.destroy)
];
