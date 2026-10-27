import { QPQConfig } from 'quidproquo-core';

import { getStorageDriveCorsSettingsByName } from '../../../configUtils/storageDrive/getStorageDriveCorsSettingsByName';
import { DomainResolver } from '../../../domain/types/DomainResolver';
import { resolveServiceScopedCorsAllowedOrigins } from './resolveServiceScopedCorsAllowedOrigins';

/** Origins allowed on a storage drive's objects: `defineStorageDriveCorsSettings` wins, else the service-scoped default. */
export const getStorageDriveCorsAllowedOrigins = (qpqConfig: QPQConfig, storageDriveName: string, resolver?: DomainResolver): string[] =>
  resolveServiceScopedCorsAllowedOrigins(qpqConfig, getStorageDriveCorsSettingsByName(qpqConfig, storageDriveName)?.allowedOrigins, resolver);
