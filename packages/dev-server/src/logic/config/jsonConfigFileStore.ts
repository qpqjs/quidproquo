import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { randomUUID } from 'crypto';

import { readJsonFileStore, writeJsonFileStore } from '../jsonFileStore';

// Offline stand-in for SSM Parameter Store / Secrets Manager. Values live in
// hand-editable JSON files under the dev server runtime path, one file per
// owning service:
//
//   <runtimePath>/parameters/<serviceName>.json   { "myParam": "value" }
//   <runtimePath>/secrets/<serviceName>.json      { "myApiKey": "<guid>" }

export enum ConfigStoreDirectory {
  parameters = 'parameters',
  secrets = 'secrets',
}

interface ConfigStorageLocation {
  serviceName: string;
  key: string;
}

// Mirrors the AWS runtime's resolveParameterKey / resolveSecretResourceName:
// a cross-module owner redirects storage to the owning service's file, and
// resourceNameOverride renames the key within it.
const resolveParameterStorageLocation = (parameterName: string, qpqConfig: QPQConfig): ConfigStorageLocation => {
  const parameterConfig = qpqCoreUtils.getParameterConfig(parameterName, qpqConfig);

  return {
    serviceName: parameterConfig.owner?.module || qpqCoreUtils.getApplicationModuleName(qpqConfig),
    key: parameterConfig.owner?.resourceNameOverride || parameterName,
  };
};

const resolveSecretStorageLocation = (secretName: string, qpqConfig: QPQConfig): ConfigStorageLocation => {
  const secretConfig = qpqCoreUtils.getSecretByName(secretName, qpqConfig);

  return {
    serviceName: secretConfig.owner?.module || qpqCoreUtils.getApplicationModuleName(qpqConfig),
    key: secretConfig.owner?.resourceNameOverride || secretName,
  };
};

export const readConfigStoreFile = async (
  runtimePath: string,
  storeDirectory: ConfigStoreDirectory,
  serviceName: string,
): Promise<Record<string, string>> => {
  return readJsonFileStore<string>(runtimePath, storeDirectory, serviceName);
};

export const writeConfigStoreValue = async (
  runtimePath: string,
  storeDirectory: ConfigStoreDirectory,
  serviceName: string,
  key: string,
  value: string,
): Promise<void> => {
  const values = await readConfigStoreFile(runtimePath, storeDirectory, serviceName);

  await writeJsonFileStore(runtimePath, storeDirectory, serviceName, { ...values, [key]: value });
};

const getOrSeedConfigStoreValue = async (
  runtimePath: string,
  storeDirectory: ConfigStoreDirectory,
  serviceName: string,
  key: string,
  buildSeedValue: () => string,
): Promise<string> => {
  const values = await readConfigStoreFile(runtimePath, storeDirectory, serviceName);

  if (key in values) {
    return values[key];
  }

  const seededValue = buildSeedValue();
  await writeConfigStoreValue(runtimePath, storeDirectory, serviceName, key, seededValue);

  return seededValue;
};

// First read seeds the file with the parameter's config default so every
// available parameter becomes visible and editable on disk.
export const getOrSeedParameterValue = async (runtimePath: string, parameterName: string, qpqConfig: QPQConfig): Promise<string> => {
  const { serviceName, key } = resolveParameterStorageLocation(parameterName, qpqConfig);

  return getOrSeedConfigStoreValue(
    runtimePath,
    ConfigStoreDirectory.parameters,
    serviceName,
    key,
    () => qpqCoreUtils.getParameterConfig(parameterName, qpqConfig).value,
  );
};

export const setParameterValue = async (runtimePath: string, parameterName: string, qpqConfig: QPQConfig, parameterValue: string): Promise<void> => {
  const { serviceName, key } = resolveParameterStorageLocation(parameterName, qpqConfig);

  await writeConfigStoreValue(runtimePath, ConfigStoreDirectory.parameters, serviceName, key, parameterValue);
};

// Secrets have no config default: the first read generates a guid and
// persists it so subsequent reads (from any service) get the same value.
export const getOrSeedSecretValue = async (runtimePath: string, secretName: string, qpqConfig: QPQConfig): Promise<string> => {
  const { serviceName, key } = resolveSecretStorageLocation(secretName, qpqConfig);

  return getOrSeedConfigStoreValue(runtimePath, ConfigStoreDirectory.secrets, serviceName, key, () => randomUUID());
};
