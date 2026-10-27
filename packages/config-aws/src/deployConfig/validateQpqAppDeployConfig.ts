import { QpqAppDeployConfig, QpqAppDeployment } from 'quidproquo-core';

// A settings key is used verbatim as an env var suffix, so it must be one.
const SETTING_KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.length > 0;

// Both maps are flat string maps; settings keys must also be valid env var suffixes.
const collectStringMapProblems = (deploymentName: string, field: string, map: unknown, isSetting: boolean): string[] => {
  if (map === undefined) return [];
  if (!isRecord(map)) return [`'${deploymentName}': "${field}" must be an object of string values`];

  return Object.entries(map).flatMap(([key, value]) => {
    const problems: string[] = [];
    if (isSetting && !SETTING_KEY_PATTERN.test(key)) {
      problems.push(`'${deploymentName}': setting "${key}" must be UPPER_SNAKE_CASE (it becomes the DEPLOY_SETTING_${key} env var)`);
    }
    if (typeof value !== 'string') {
      problems.push(`'${deploymentName}': "${field}.${key}" must be a string (parse numbers and booleans where they are read)`);
    }
    return problems;
  });
};

const collectDeploymentProblems = (deploymentName: string, deployment: unknown): string[] => {
  if (!isRecord(deployment)) return [`'${deploymentName}': must be an object`];

  return [
    ...(isNonEmptyString(deployment.name) ? [] : [`'${deploymentName}': "name" must be a non-empty string`]),
    ...(isNonEmptyString(deployment.environment) ? [] : [`'${deploymentName}': "environment" must be a non-empty string`]),
    ...(deployment.feature === undefined || isNonEmptyString(deployment.feature)
      ? []
      : [`'${deploymentName}': "feature" must be a non-empty string when set`]),
    ...(isNonEmptyString(deployment.platform) ? [] : [`'${deploymentName}': "platform" must be a non-empty string`]),
    ...collectStringMapProblems(deploymentName, 'platformSettings', deployment.platformSettings, false),
    ...collectStringMapProblems(deploymentName, 'settings', deployment.settings, true),
  ];
};

/**
 * Narrows parsed deploy.config.json to QpqAppDeployConfig, throwing one error that lists
 * every problem found so a broken file is fixed in one pass rather than one field at a time.
 * Which platformSettings keys a platform needs is checked by the platform (`validateAwsDeployment`), not here.
 */
export const validateQpqAppDeployConfig = (raw: unknown, configPath: string): QpqAppDeployConfig => {
  const problems: string[] = [];

  if (!isRecord(raw) || !isRecord(raw.deployments)) {
    problems.push('must be { "deployments": { "<name>": { ... } } }');
  } else if (Object.keys(raw.deployments).length === 0) {
    problems.push('"deployments" must have at least one entry');
  } else {
    for (const [deploymentName, deployment] of Object.entries(raw.deployments)) {
      if (!isNonEmptyString(deploymentName)) problems.push('a deployment name must be a non-empty string');
      problems.push(...collectDeploymentProblems(deploymentName, deployment));
    }
  }

  if (problems.length > 0) {
    throw new Error(`Invalid ${configPath}:\n  - ${problems.join('\n  - ')}`);
  }

  return { deployments: (raw as { deployments: Record<string, QpqAppDeployment> }).deployments };
};
