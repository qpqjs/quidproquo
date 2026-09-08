import { GlobalQPQConfigSetting, KeyValueStoreQPQConfigSetting, QPQConfig, QPQConfigSetting, QPQCoreConfigSettingType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { adminSessionStoreName } from '../constants/adminSessionConstants';
import { defineAdminSettings } from './defineAdminSettings';

const flattenConfig = (config: QPQConfig): QPQConfigSetting[] => config.flatMap((item) => (Array.isArray(item) ? flattenConfig(item) : [item]));

const findLogServiceSettings = (config: QPQConfig, service: string): QPQConfigSetting[] => {
  const serviceSettings = flattenConfig(config).filter((s) => s.configSettingType === QPQCoreConfigSettingType.serviceSettings) as unknown as {
    settingsByService: Record<string, QPQConfig>;
  }[];

  return serviceSettings.flatMap((s) => flattenConfig(s.settingsByService[service] ?? []));
};

const findOwnedGlobal = (config: QPQConfig, service: string, key: string): unknown => {
  const global = findLogServiceSettings(config, service).find(
    (s) => s.configSettingType === QPQCoreConfigSettingType.global && (s as GlobalQPQConfigSetting<unknown>).key === key,
  ) as GlobalQPQConfigSetting<unknown> | undefined;

  return global?.value;
};

describe('defineAdminSettings', () => {
  it('leaves the log retention undefined when no retention is configured', () => {
    const config = defineAdminSettings('log');

    expect(findOwnedGlobal(config, 'log', 'qpq-log-retention-days')).toBeUndefined();
  });

  it('keeps the configured retention when no cold storage is set', () => {
    const config = defineAdminSettings('log', { logRetentionDays: 30 });

    expect(findOwnedGlobal(config, 'log', 'qpq-log-retention-days')).toBe(30);
  });

  it('pads retention by 180 days past the cold-storage window', () => {
    const config = defineAdminSettings('log', { logRetentionDays: 30, coldStorageAfterDays: 10 });

    expect(findOwnedGlobal(config, 'log', 'qpq-log-retention-days')).toBe(190);
  });

  it('exposes the configured service names to the admin', () => {
    const config = defineAdminSettings('log', { services: ['billing', 'auth'] });

    expect(findOwnedGlobal(config, 'log', 'qpq-serviceNames')).toEqual(['billing', 'auth']);
  });

  it('includes the core admin log stores', () => {
    const config = defineAdminSettings('log');

    const kvsNames = findLogServiceSettings(config, 'log')
      .filter((s) => s.configSettingType === QPQCoreConfigSettingType.keyValueStore)
      .map((s) => (s as KeyValueStoreQPQConfigSetting).keyValueStoreName);

    expect(kvsNames).toContain('qpq-logs');
  });

  it('includes the action search stores and routes on the log service', () => {
    const config = defineAdminSettings('log');
    const logSettings = findLogServiceSettings(config, 'log');

    const kvsNames = logSettings
      .filter((s) => s.configSettingType === QPQCoreConfigSettingType.keyValueStore)
      .map((s) => (s as KeyValueStoreQPQConfigSetting).keyValueStoreName);

    expect(kvsNames).toContain('qpq-log-actions');
    expect(kvsNames).toContain('qpq-log-entities');
    expect(kvsNames).toContain('qpq-log-entity-lookup');

    const routePaths = logSettings.map((s) => (s as unknown as { path?: string }).path).filter((path) => !!path);

    expect(routePaths).toContain('/actionSearch/actions/list');
    expect(routePaths).toContain('/actionSearch/entities/list');
    expect(routePaths).toContain('/actionSearch/entity/timeline');
  });

  it('defines the admin session event doc stores on the log service', () => {
    const config = defineAdminSettings('log');

    const kvsNames = findLogServiceSettings(config, 'log')
      .filter((s) => s.configSettingType === QPQCoreConfigSettingType.keyValueStore)
      .map((s) => (s as KeyValueStoreQPQConfigSetting).keyValueStoreName);

    expect(kvsNames).toContain(adminSessionStoreName);
    expect(kvsNames).toContain(`${adminSessionStoreName}Events`);
  });

  it('mounts the session routes under /v1/admin/session', () => {
    const config = defineAdminSettings('log');

    const logSettings = findLogServiceSettings(config, 'log') as (QPQConfigSetting & { path?: string; method?: string })[];
    const routePaths = logSettings.filter((s) => typeof s.path === 'string').map((s) => `${s.method} ${s.path}`);

    expect(routePaths).toContain('POST /v1/admin/session');
    expect(routePaths).toContain('POST /v1/admin/session/{id}/events');
    expect(routePaths).toContain('GET /v1/admin/session/{id}/events');
  });
});
