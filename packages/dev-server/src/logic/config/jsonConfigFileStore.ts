import { generateUuid, QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { readJsonFileStore, writeJsonFileStore } from '../jsonFileStore';
import { resolveOwnedStoreLocation } from './resolveOwnedStoreLocation';

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

type ConfigStorageLocation = {
  serviceName: string;
  key: string;
};

// Owner handling is resolveOwnedStoreLocation's: a cross-module owner redirects to the owning
// service's file and its override renames the key within it, as the AWS runtime does.
const resolveParameterStorageLocation = (parameterName: string, qpqConfig: QPQConfig): ConfigStorageLocation => {
  const parameterConfig = qpqCoreUtils.resolveParameterOrThrow(parameterName, qpqConfig);

  return resolveOwnedStoreLocation(parameterName, parameterConfig.owner, qpqConfig);
};

const resolveSecretStorageLocation = (secretName: string, qpqConfig: QPQConfig): ConfigStorageLocation => {
  const secretConfig = qpqCoreUtils.resolveSecretOrThrow(secretName, qpqConfig);

  return resolveOwnedStoreLocation(secretName, secretConfig.owner, qpqConfig);
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

  const existing = values[key];
  if (existing !== undefined) {
    return existing;
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
    () => qpqCoreUtils.resolveParameterOrThrow(parameterName, qpqConfig).value,
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

  return getOrSeedConfigStoreValue(runtimePath, ConfigStoreDirectory.secrets, serviceName, key, () => generateUuid());
};
