import fs from 'fs';
import path from 'path';

// apps/<app>/deploy.config.json — the machine-readable half of an app's deploy
// identity. Kept as JSON (not TS) so tooling can read it before any TS
// executes (discovery, prompts, credential checks).
export interface QpqAppDeployEnvironment {
  // Deploy platform driver for this environment (default 'aws') — qpq go
  // dispatches on it, so a future environment can move platforms with a
  // config change instead of a different command.
  platform?: string;

  // Platform-specific identity — aws needs both; other platforms (e.g. docker)
  // may need neither.
  accountId?: string;
  region?: string;
}

export interface QpqAppDeployConfig {
  prefix: string;

  // environment name -> where it deploys. Owning this here (not env vars) is
  // what lets `qpq go --env production` need no AWS_DEFAULT_* variables.
  environments?: Record<string, QpqAppDeployEnvironment>;
}

// Deploy-time context handed to the app's account.qpq.ts / bootstrap.qpq.ts
// config fragments.
export interface QpqAppDeployContext {
  appName: string;
  appDir: string;

  prefix: string;

  environment: string;
  accountId: string;
  region: string;

  actorName?: string;
}

export const getQpqAppDeployConfig = (root: string, appName: string): QpqAppDeployConfig => {
  const configPath = path.join(root, 'apps', appName, 'deploy.config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`Missing ${configPath} — create it with { "prefix": "...", "environments": { ... } }`);
  }

  return JSON.parse(fs.readFileSync(configPath, 'utf8'));
};

export const getQpqAppDeployContext = (
  root: string,
  appName: string,
  environment: string,
  actorName: string | undefined,
  envOverride?: Partial<QpqAppDeployEnvironment>,
): QpqAppDeployContext => {
  const deployConfig = getQpqAppDeployConfig(root, appName);

  const configuredEnvironment = deployConfig.environments?.[environment];
  const accountId = envOverride?.accountId ?? configuredEnvironment?.accountId;
  const region = envOverride?.region ?? configuredEnvironment?.region;

  if (!accountId || !region) {
    throw new Error(
      `No deploy target for environment '${environment}' — add it to apps/${appName}/deploy.config.json under "environments", or set AWS_DEFAULT_ACCOUNT / AWS_DEFAULT_REGION`,
    );
  }

  return {
    appName,
    appDir: path.join(root, 'apps', appName),

    prefix: deployConfig.prefix,

    environment,
    accountId,
    region,

    actorName,
  };
};
