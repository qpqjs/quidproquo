import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { defineApplication, QPQConfig } from 'quidproquo-core';

import fs from 'fs';
import path from 'path';

import { QpqAppDeployContext } from './qpqAppDeployConfig';

// Loads an optional per-app config fragment (apps/<app>/account.qpq.ts or
// bootstrap.qpq.ts) — a default-exported `(ctx) => QPQConfig` of app-specific
// EXTRAS. The identity plumbing (defineApplication +
// defineAwsServiceAccountInfo) is provided by the callers below, so fragments
// must not declare their own. Requiring TS relies on the caller running with
// TS require hooks (ts-node), as the CDK app invocation does.
const loadAppConfigFragment = (ctx: QpqAppDeployContext, fileName: string): QPQConfig => {
  const fragmentPath = path.join(ctx.appDir, fileName);
  if (!fs.existsSync(fragmentPath)) {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fragmentModule = require(path.join(ctx.appDir, fileName.replace(/\.ts$/, '')));
  const fragment = fragmentModule.default || fragmentModule;

  return typeof fragment === 'function' ? fragment(ctx) : fragment;
};

// Account-level guardrails — one statically named stack per AWS account,
// independent of any app. The app name / environment here only satisfy config
// plumbing; account resources key on accountId/region.
export const getWorkspaceAccountQpqConfig = (ctx: QpqAppDeployContext): QPQConfig => [
  defineApplication('account', ctx.environment, ctx.appDir),

  defineAwsServiceAccountInfo(ctx.accountId, ctx.region),

  ...loadAppConfigFragment(ctx, 'account.qpq.ts'),
];

// The app's bootstrap config: apex/zone/cert/WAF-level resources every service
// in the app builds on. The fragment declares defineDns like every service does.
// Resource names are prefixed with the app prefix, so multiple apps can bootstrap
// into one shared AWS account.
export const getWorkspaceBootstrapQpqConfig = (ctx: QpqAppDeployContext): QPQConfig => [
  defineApplication(ctx.prefix, ctx.environment, ctx.appDir, ctx.actorName),

  defineAwsServiceAccountInfo(ctx.accountId, ctx.region),

  ...loadAppConfigFragment(ctx, 'bootstrap.qpq.ts'),
];

// A service's own QPQ config, loaded straight from its infrastructure.ts (its
// @scope imports resolve through the workspace node_modules symlinks to built
// dist — no tsconfig-paths registration needed under ts-node).
export const getWorkspaceServiceQpqConfig = (root: string, appName: string, serviceName: string): QPQConfig => {
  const infrastructurePath = path.join(root, 'apps', appName, 'services', serviceName, 'service', 'src', 'infrastructure');

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const infraModule = require(infrastructurePath);
  return infraModule.default || infraModule;
};
