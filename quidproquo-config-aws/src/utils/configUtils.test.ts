import { buildTestQpqConfig, defineKeyValueStore, defineStorageDrive } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { defineAccountBudget, defineAccountCloudTrail, defineAccountSecurityServices } from '../config/settings/account';
import {
  AwsAlarmLambdaMetricName,
  AwsAlarmNamespace,
  AwsAlarmOperator,
  AwsAlarmPeriod,
  AwsAlarmStatistic,
  defineAwsAlarm,
} from '../config/settings/awsAlarm';
import { AwsDataStoreRemovalPolicy, defineAwsDataStoreRemovalPolicy } from '../config/settings/awsDataStoreRemovalPolicy';
import { defineAwsDyanmoOverrideForKvs } from '../config/settings/awsDyanmoOverrideForKvs';
import { AwsKmsKeyTargetType, defineAwsKmsKey } from '../config/settings/awsKmsKey';
import { defineAwsServiceDashboard } from '../config/settings/awsServiceDashboard';
import { defineAwsVirtualNetworkSettings } from '../config/settings/awsVirtualNetworkSettings';
import { defineDomainCertificate } from '../config/settings/domainCertificate';
import { defineBootstrapAwsOrganization } from '../config/settings/organizations';
import { defineAwsServiceAccountInfo } from '../config/settings/serviceAccountInfo';
import { defineBootstrapWaf, defineWafProtection } from '../config/settings/waf';
import { ServiceAccountInfo } from '../types';
import {
  getAccountBudgetConfigs,
  getAccountCloudTrailConfigs,
  getAccountSecurityServicesConfig,
  getApplicationModuleDeployAccountId,
  getApplicationModuleDeployRegion,
  getAwsAccountIds,
  getAwsBootstrapOrganizationConfigs,
  getAwsDataStoreRemovalPolicy,
  getAwsKmsKeyForKeyValueStore,
  getAwsKmsKeyForStorageDrive,
  getAwsKmsKeys,
  getAwsServiceAccountInfoByDeploymentInfo,
  getAwsServiceAccountInfoConfig,
  getAwsServiceAccountInfos,
  getAwsServiceDashboardConfig,
  getAwsVirtualNetworkSettings,
  getBootstrapWafConfig,
  getDomainCertificateArnSsmParameterName,
  getDomainCertificateConfigs,
  getDynamoTableNameOverrride,
  getLayerProvidedModules,
  getLocalServiceAccountInfo,
  getOwnedAwsAlarmConfigs,
  getWafWebAclArnSsmParameterName,
  isLambdaWarmingDisabled,
  isReservedConcurrencyDisabled,
  isTracingDisabled,
  isWafProtectionEnabled,
  resolveAwsServiceAccountInfo,
} from './configUtils';

const alarmSettings = {
  namespace: AwsAlarmNamespace.Lambda,
  metricName: AwsAlarmLambdaMetricName.Errors,
  statistic: AwsAlarmStatistic.Sum,
  period: AwsAlarmPeriod.FiveMinutes,
  operator: AwsAlarmOperator.GreaterThanThreshold,
  threshold: 1,
  datapointsToAlarm: 1,
  evaluationPeriodsToAlarm: 1,
  onAlarm: {},
} as const;

describe('getAwsServiceAccountInfoConfig', () => {
  it('returns the single service account info setting', () => {
    const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'us-east-1')]);

    expect(getAwsServiceAccountInfoConfig(config).deployAccountId).toBe('111');
  });

  it('throws when no service account info is defined', () => {
    expect(() => getAwsServiceAccountInfoConfig(buildTestQpqConfig())).toThrow();
  });

  it('throws when more than one service account info is defined', () => {
    const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'us-east-1'), defineAwsServiceAccountInfo('222', 'us-west-2')]);

    expect(() => getAwsServiceAccountInfoConfig(config)).toThrow();
  });
});

describe('getLayerProvidedModules', () => {
  it('collects modules across all layers', () => {
    const config = buildTestQpqConfig([
      defineAwsServiceAccountInfo('111', 'us-east-1', [], {
        apiLayers: [
          { name: 'chromium', buildPath: '../layers/chromium.zip', modules: ['@sparticuz/chromium'] },
          { name: 'tools', layerArn: 'arn:aws:lambda:us-east-1:111:layer:tools:1', modules: ['sharp', 'canvas'] },
          { name: 'no-modules', layerArn: 'arn:aws:lambda:us-east-1:111:layer:bare:1' },
        ],
      }),
    ]);

    expect(getLayerProvidedModules(config)).toEqual(['@sparticuz/chromium', 'sharp', 'canvas']);
  });

  it('returns an empty list when no service account info is defined', () => {
    expect(getLayerProvidedModules(buildTestQpqConfig())).toEqual([]);
  });
});

describe('getAwsBootstrapOrganizationConfigs', () => {
  it('returns the defined organization settings', () => {
    const config = buildTestQpqConfig([defineBootstrapAwsOrganization('ou-root', 'aws@example.com', 'acme', ['dev'])]);

    expect(getAwsBootstrapOrganizationConfigs(config)).toHaveLength(1);
  });

  it('returns an empty list when none are defined', () => {
    expect(getAwsBootstrapOrganizationConfigs(buildTestQpqConfig())).toEqual([]);
  });
});

describe('account level selectors', () => {
  it('returns the defined budget settings', () => {
    const config = buildTestQpqConfig([defineAccountBudget('main', 100, ['ops@example.com'])]);

    expect(getAccountBudgetConfigs(config)).toHaveLength(1);
  });

  it('returns an empty list when no budgets are defined', () => {
    expect(getAccountBudgetConfigs(buildTestQpqConfig())).toEqual([]);
  });

  it('returns the security services setting or undefined', () => {
    expect(getAccountSecurityServicesConfig(buildTestQpqConfig())).toBeUndefined();

    const config = buildTestQpqConfig([defineAccountSecurityServices({ enableSecurityHub: true })]);
    expect(getAccountSecurityServicesConfig(config)?.enableSecurityHub).toBe(true);
  });
});

describe('getAwsServiceDashboardConfig', () => {
  it('returns the dashboard setting or undefined', () => {
    expect(getAwsServiceDashboardConfig(buildTestQpqConfig())).toBeUndefined();

    const config = buildTestQpqConfig([defineAwsServiceDashboard({ disableAnomalyDetection: true })]);
    expect(getAwsServiceDashboardConfig(config)?.disableAnomalyDetection).toBe(true);
  });
});

describe('waf selectors', () => {
  it('returns undefined / false when no waf settings are declared', () => {
    const config = buildTestQpqConfig();

    expect(getBootstrapWafConfig(config)).toBeUndefined();
    expect(isWafProtectionEnabled(config)).toBe(false);
  });

  it('returns the declared bootstrap waf setting and protection flag', () => {
    const config = buildTestQpqConfig([defineBootstrapWaf({ rateLimits: [{ name: 'auth', limit: 100 }] }), defineWafProtection()]);

    expect(getBootstrapWafConfig(config)?.rateLimits).toEqual([{ name: 'auth', limit: 100 }]);
    expect(isWafProtectionEnabled(config)).toBe(true);
  });

  it('derives the web acl arn ssm parameter name from app and environment', () => {
    const config = buildTestQpqConfig();

    expect(getWafWebAclArnSsmParameterName('regional', config)).toBe('/qpq/waf/web-acl-arn/regional/test-app-development');
    expect(getWafWebAclArnSsmParameterName('cloudfront', config)).toBe('/qpq/waf/web-acl-arn/cloudfront/test-app-development');
  });

  it('includes the feature in the parameter name when set', () => {
    const config = buildTestQpqConfig([], { feature: 'joe' });

    expect(getWafWebAclArnSsmParameterName('regional', config)).toBe('/qpq/waf/web-acl-arn/regional/test-app-development-joe');
  });
});

describe('getAwsDataStoreRemovalPolicy', () => {
  it('defaults to retain when no setting is declared', () => {
    expect(getAwsDataStoreRemovalPolicy(buildTestQpqConfig())).toBe(AwsDataStoreRemovalPolicy.retain);
  });

  it('returns the declared removal policy', () => {
    const config = buildTestQpqConfig([defineAwsDataStoreRemovalPolicy(AwsDataStoreRemovalPolicy.destroy)]);

    expect(getAwsDataStoreRemovalPolicy(config)).toBe(AwsDataStoreRemovalPolicy.destroy);
  });
});

describe('getAwsVirtualNetworkSettings', () => {
  it('returns the declared setting matching the virtual network name', () => {
    const config = buildTestQpqConfig([
      defineAwsVirtualNetworkSettings('other', { maxAzs: 3 }),
      defineAwsVirtualNetworkSettings('main', { natGateways: 1, interfaceEndpoints: ['secretsmanager'] }),
    ]);

    const settings = getAwsVirtualNetworkSettings(config, 'main');
    expect(settings.natGateways).toBe(1);
    expect(settings.interfaceEndpoints).toEqual(['secretsmanager']);
    expect(settings.maxAzs).toBe(2);
  });

  it('falls back to secure defaults when no setting is declared', () => {
    const settings = getAwsVirtualNetworkSettings(buildTestQpqConfig(), 'main');

    expect(settings.flowLogs.disable).toBe(false);
    expect(settings.disableS3GatewayEndpoint).toBe(false);
    expect(settings.disableDynamoDbGatewayEndpoint).toBe(false);
    expect(settings.natGateways).toBeUndefined();
  });

  it('ignores settings declared for a different virtual network', () => {
    const config = buildTestQpqConfig([defineAwsVirtualNetworkSettings('other', { flowLogs: { disable: true } })]);

    expect(getAwsVirtualNetworkSettings(config, 'main').flowLogs.disable).toBe(false);
  });
});

describe('getAccountCloudTrailConfigs', () => {
  it('returns the defined cloud trail settings', () => {
    const config = buildTestQpqConfig([defineAccountCloudTrail('trail')]);

    expect(getAccountCloudTrailConfigs(config)).toHaveLength(1);
  });
});

describe('getAwsServiceAccountInfos', () => {
  it('appends the local service account info and dedupes identical service entries', () => {
    const remote: ServiceAccountInfo = { moduleName: 'auth', awsAccountId: '999', awsRegion: 'us-west-2' };
    const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'us-east-1', [remote, { ...remote }])]);

    const infos = getAwsServiceAccountInfos(config);

    expect(infos).toHaveLength(2);
    expect(infos.some((i) => i.moduleName === 'auth')).toBe(true);
    expect(infos.some((i) => i.moduleName === 'test-module')).toBe(true);
  });
});

describe('getLocalServiceAccountInfo', () => {
  it('derives the local service from the app module and the deploy account', () => {
    const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'us-east-1')]);

    expect(getLocalServiceAccountInfo(config)).toEqual({
      moduleName: 'test-module',
      applicationName: 'test-app',
      environment: 'development',
      feature: undefined,
      awsAccountId: '111',
      awsRegion: 'us-east-1',
    });
  });
});

describe('getAwsAccountIds', () => {
  it('returns the unique set of account ids across services', () => {
    const config = buildTestQpqConfig([
      defineAwsServiceAccountInfo('111', 'us-east-1', [
        { moduleName: 'a', awsAccountId: '111', awsRegion: 'us-east-1' },
        { moduleName: 'b', awsAccountId: '222', awsRegion: 'us-east-1' },
      ]),
    ]);

    expect(getAwsAccountIds(config).sort()).toEqual(['111', '222']);
  });
});

describe('deploy account and region selectors', () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);

  it('reads the deploy region', () => {
    expect(getApplicationModuleDeployRegion(config)).toBe('eu-west-1');
  });

  it('reads the deploy account id', () => {
    expect(getApplicationModuleDeployAccountId(config)).toBe('111');
  });
});

describe('disable flag selectors', () => {
  const config = buildTestQpqConfig([
    defineAwsServiceAccountInfo('111', 'us-east-1', [], {
      disableLambdaWarming: true,
      disableReservedConcurrency: true,
      disableTracing: true,
    }),
  ]);

  it('reads disableLambdaWarming', () => {
    expect(isLambdaWarmingDisabled(config)).toBe(true);
  });

  it('reads disableReservedConcurrency', () => {
    expect(isReservedConcurrencyDisabled(config)).toBe(true);
  });

  it('reads disableTracing', () => {
    expect(isTracingDisabled(config)).toBe(true);
  });
});

describe('resolveAwsServiceAccountInfo', () => {
  it('resolves the local service when no cross module owner is given', () => {
    const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'us-east-1')]);

    expect(resolveAwsServiceAccountInfo(config).moduleName).toBe('test-module');
  });
});

describe('getAwsServiceAccountInfoByDeploymentInfo', () => {
  it('prefers the more specific match when weights tie', () => {
    const exact: ServiceAccountInfo = {
      moduleName: 'mod1',
      applicationName: 'app1',
      environment: 'env1',
      feature: 'feat1',
      awsAccountId: 'exact',
      awsRegion: 'r1',
    };
    const broad: ServiceAccountInfo = { moduleName: 'mod1', awsAccountId: 'broad', awsRegion: 'r2' };
    const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'us-east-1', [exact, broad])]);

    expect(getAwsServiceAccountInfoByDeploymentInfo(config, 'mod1', 'env1', 'feat1', 'app1').awsAccountId).toBe('exact');
  });

  it('throws when nothing matches the target', () => {
    const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'us-east-1')], { feature: 'feat' });

    expect(() => getAwsServiceAccountInfoByDeploymentInfo(config, 'nope', 'nope', 'nope', 'nope')).toThrow();
  });
});

describe('getOwnedAwsAlarmConfigs', () => {
  it('returns alarms owned by the local module', () => {
    const config = buildTestQpqConfig([defineAwsAlarm('errors', alarmSettings)]);

    expect(getOwnedAwsAlarmConfigs(config)).toHaveLength(1);
  });
});

describe('getDomainCertificateConfigs', () => {
  it('returns the defined certificate settings', () => {
    const config = buildTestQpqConfig([defineDomainCertificate('us-east-1', [{ subdomain: 'api' }])]);

    expect(getDomainCertificateConfigs(config)).toHaveLength(1);
  });
});

describe('getDomainCertificateArnSsmParameterName', () => {
  it('keys the parameter by region, app and environment, with the feature when present', () => {
    expect(getDomainCertificateArnSsmParameterName('us-east-1', buildTestQpqConfig())).toBe(
      '/qpq/domain/certificate-arn/us-east-1/test-app-development',
    );
    expect(getDomainCertificateArnSsmParameterName('us-east-1', buildTestQpqConfig([], { feature: 'joe' }))).toBe(
      '/qpq/domain/certificate-arn/us-east-1/test-app-development-joe',
    );
  });
});

describe('getAwsKmsKeys', () => {
  it('returns the defined kms key settings', () => {
    const config = buildTestQpqConfig([defineAwsKmsKey('k', 'arn', AwsKmsKeyTargetType.storageDrive, { name: 'files', module: 'test-module' })]);

    expect(getAwsKmsKeys(config)).toHaveLength(1);
  });
});

describe('getAwsKmsKeyForStorageDrive', () => {
  it('matches a key by storage drive name and owning module', () => {
    const config = buildTestQpqConfig([
      defineStorageDrive('files'),
      defineAwsKmsKey('filesKey', 'arn', AwsKmsKeyTargetType.storageDrive, { name: 'files', module: 'test-module' }),
    ]);

    const storageDrive = defineStorageDrive('files');

    expect(getAwsKmsKeyForStorageDrive(config, storageDrive)?.keyname).toBe('filesKey');
  });

  it('returns undefined when no key matches', () => {
    const config = buildTestQpqConfig([defineStorageDrive('files')]);

    expect(getAwsKmsKeyForStorageDrive(config, defineStorageDrive('files'))).toBeUndefined();
  });
});

describe('getAwsKmsKeyForKeyValueStore', () => {
  it('matches a key by key value store name and owning module', () => {
    const config = buildTestQpqConfig([
      defineKeyValueStore('users', 'id'),
      defineAwsKmsKey('usersKey', 'arn', AwsKmsKeyTargetType.keyValueStore, { name: 'users', module: 'test-module' }),
    ]);

    expect(getAwsKmsKeyForKeyValueStore(config, defineKeyValueStore('users', 'id'))?.keyname).toBe('usersKey');
  });

  it('returns undefined when no key matches', () => {
    const config = buildTestQpqConfig([defineKeyValueStore('users', 'id')]);

    expect(getAwsKmsKeyForKeyValueStore(config, defineKeyValueStore('users', 'id'))).toBeUndefined();
  });
});

describe('getDynamoTableNameOverrride', () => {
  it('returns the override table name when the kvs resource matches', () => {
    const config = buildTestQpqConfig([
      defineKeyValueStore('users', 'id'),
      defineAwsDyanmoOverrideForKvs(
        'override',
        { keyValueStoreName: 'users', module: 'test-module', application: 'test-app', environment: 'development', feature: '' },
        'users-table',
      ),
    ]);

    expect(getDynamoTableNameOverrride('users', config)).toBe('users-table');
  });

  it('returns an empty string when no override matches', () => {
    const config = buildTestQpqConfig([defineKeyValueStore('users', 'id')]);

    expect(getDynamoTableNameOverrride('users', config)).toBe('');
  });
});
