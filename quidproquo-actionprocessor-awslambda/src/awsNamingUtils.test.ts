import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig, defineQueue, defineUserDirectory, QPQConfig } from 'quidproquo-core';
import { defineWebsocket } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import {
  getAccountStackName,
  getApiStackName,
  getBaseStackName,
  getBootstrapStackName,
  getCFExportNameApiKeyIdFromConfig,
  getCFExportNameCachePolicyIdFromConfig,
  getCFExportNameDistributionIdArnFromConfig,
  getCFExportNameSnsTopicArnFromConfig,
  getCFExportNameUserPoolClientIdFromConfig,
  getCFExportNameUserPoolIdFromConfig,
  getCFExportNameWebsocketApiIdFromConfig,
  getConfigRuntimeBootstrapResourceName,
  getConfigRuntimeResourceName,
  getConfigRuntimeResourceNameFromConfig,
  getConfigRuntimeResourceNameFromConfigWithServiceOverride,
  getDomainStackName,
  getEventBusSnsTopicArn,
  getGlobalConfigRuntimeResourceName,
  getGlobalQpqRuntimeResourceName,
  getInfStackName,
  getKvsDynamoTableNameFromConfig,
  getQpqRuntimeResourceName,
  getQpqRuntimeResourceNameFromConfig,
  getQueueRuntimeResourceNameFromConfig,
  getWebsocketApiIdSsmParameterName,
  getWebStackName,
  resolveConfigRuntimeResourceNameFromConfig,
  withFifoSuffix,
} from './awsNamingUtils';

const websocketEventProcessors = { onConnect: undefined, onDisconnect: undefined } as any;

describe('getGlobalConfigRuntimeResourceName', () => {
  it('joins the resource, application and environment', () => {
    expect(getGlobalConfigRuntimeResourceName('res', 'app', 'dev')).toBe('res-app-dev');
  });

  it('appends the feature when present', () => {
    expect(getGlobalConfigRuntimeResourceName('res', 'app', 'dev', 'beta')).toBe('res-app-dev-beta');
  });
});

describe('getGlobalQpqRuntimeResourceName', () => {
  it('suffixes the global name with -qpq and the resource type', () => {
    expect(getGlobalQpqRuntimeResourceName('res', 'app', 'dev', undefined, '-topic')).toBe('res-app-dev-qpq-topic');
  });
});

describe('getConfigRuntimeResourceName', () => {
  it('joins resource, application, service and environment', () => {
    expect(getConfigRuntimeResourceName('res', 'app', 'svc', 'dev')).toBe('res-app-svc-dev');
  });

  it('appends the feature when present', () => {
    expect(getConfigRuntimeResourceName('res', 'app', 'svc', 'dev', 'beta')).toBe('res-app-svc-dev-beta');
  });
});

describe('getConfigRuntimeBootstrapResourceName', () => {
  it('omits the service segment', () => {
    expect(getConfigRuntimeBootstrapResourceName('res', 'app', 'dev', 'beta')).toBe('res-app-dev-beta');
  });
});

describe('getQpqRuntimeResourceName', () => {
  it('suffixes the config name with -qpq and the resource type', () => {
    expect(getQpqRuntimeResourceName('res', 'app', 'svc', 'dev', undefined, '-table')).toBe('res-app-svc-dev-qpq-table');
  });
});

describe('getConfigRuntimeResourceNameFromConfig', () => {
  it('derives application, service and environment from the config', () => {
    expect(getConfigRuntimeResourceNameFromConfig('res', buildTestQpqConfig())).toBe('res-test-app-test-module-development');
  });

  it('includes the feature from the config when set', () => {
    expect(getConfigRuntimeResourceNameFromConfig('res', buildTestQpqConfig([], { feature: 'beta' }))).toBe(
      'res-test-app-test-module-development-beta',
    );
  });
});

describe('resolveConfigRuntimeResourceNameFromConfig', () => {
  it('uses the config context when no owner is supplied', () => {
    expect(resolveConfigRuntimeResourceNameFromConfig('res', buildTestQpqConfig())).toBe('res-test-app-test-module-development');
  });

  it('prefers the owner application, module, environment and feature', () => {
    const owner = { application: 'other-app', module: 'other-svc', environment: 'prod', feature: 'beta' };

    expect(resolveConfigRuntimeResourceNameFromConfig('res', buildTestQpqConfig(), owner)).toBe('res-other-app-other-svc-prod-beta');
  });
});

describe('getConfigRuntimeResourceNameFromConfigWithServiceOverride', () => {
  it('overrides only the service segment', () => {
    expect(getConfigRuntimeResourceNameFromConfigWithServiceOverride('res', buildTestQpqConfig(), 'override-svc')).toBe(
      'res-test-app-override-svc-development',
    );
  });
});

describe('getQpqRuntimeResourceNameFromConfig', () => {
  it('builds a -qpq suffixed name from the config', () => {
    expect(getQpqRuntimeResourceNameFromConfig('res', buildTestQpqConfig(), '-bucket')).toBe('res-test-app-test-module-development-qpq-bucket');
  });

  it('honours a cross-service resource name service override', () => {
    expect(getQpqRuntimeResourceNameFromConfig({ name: 'res', service: 'auth' }, buildTestQpqConfig())).toBe('res-test-app-auth-development-qpq');
  });
});

describe('withFifoSuffix', () => {
  it('appends .fifo only when isFifo is true', () => {
    expect(withFifoSuffix('res', true)).toBe('res.fifo');
    expect(withFifoSuffix('res', false)).toBe('res');
    expect(withFifoSuffix('res')).toBe('res');
  });
});

describe('getQueueRuntimeResourceNameFromConfig', () => {
  it('returns the standard decorated name for a non-FIFO queue', () => {
    const config = buildTestQpqConfig([defineQueue('jobs', {})]);

    expect(getQueueRuntimeResourceNameFromConfig('jobs', config)).toBe('jobs-test-app-test-module-development');
  });

  it('appends .fifo after the decoration for a FIFO queue', () => {
    const config = buildTestQpqConfig([defineQueue('jobs', {}, { isFifo: true })]);

    expect(getQueueRuntimeResourceNameFromConfig('jobs', config)).toBe('jobs-test-app-test-module-development.fifo');
  });

  it('falls back to the standard name when the queue config is not found', () => {
    expect(getQueueRuntimeResourceNameFromConfig('jobs', buildTestQpqConfig())).toBe('jobs-test-app-test-module-development');
  });
});

describe('getKvsDynamoTableNameFromConfig', () => {
  it('builds the dynamo table name from the config when there is no override', () => {
    expect(getKvsDynamoTableNameFromConfig('users', buildTestQpqConfig(), '-table')).toBe('users-test-app-test-module-development-qpq-table');
  });
});

describe('cloudformation export names', () => {
  it('builds the cache policy export name', () => {
    expect(getCFExportNameCachePolicyIdFromConfig('cache', buildTestQpqConfig())).toBe(
      'cache-test-app-test-module-development-qpqcache-policy-name-export',
    );
  });

  it('builds the api key export name', () => {
    expect(getCFExportNameApiKeyIdFromConfig('key', buildTestQpqConfig())).toBe('key-test-app-test-module-development-qpqapi-key-id-export');
  });

  it('builds the distribution export name', () => {
    expect(getCFExportNameDistributionIdArnFromConfig('web', buildTestQpqConfig())).toBe(
      'web-test-app-test-module-development-qpqdistribution-id-export',
    );
  });

  it('builds the sns topic export name without the service segment', () => {
    expect(getCFExportNameSnsTopicArnFromConfig('bus', buildTestQpqConfig())).toBe('bus-test-app-development-qpqsns-topic-arn-export');
  });

  it('builds the user pool export name from the user directory config', () => {
    const config = buildTestQpqConfig([defineUserDirectory('users')]);

    expect(getCFExportNameUserPoolIdFromConfig('users', config)).toBe('users-test-app-test-module-development-qpquser-pool-id-export');
  });

  it('builds the user pool client export name from the user directory config', () => {
    const config = buildTestQpqConfig([defineUserDirectory('users')]);

    expect(getCFExportNameUserPoolClientIdFromConfig('users', config)).toBe('users-test-app-test-module-development-qpquser-pool-client-id-export');
  });

  it('builds the websocket api export name from the websocket config', () => {
    const config = buildTestQpqConfig([defineWebsocket('ws', websocketEventProcessors)]);

    expect(getCFExportNameWebsocketApiIdFromConfig('api', config)).toBe('api-test-app-test-module-development-qpqwebsocket-api-id-export');
  });

  it('builds the websocket api id ssm parameter name from the websocket config', () => {
    const config = buildTestQpqConfig([defineWebsocket('ws', websocketEventProcessors)]);

    expect(getWebsocketApiIdSsmParameterName('api', config)).toBe('/qpq/websocket/api-id/api-test-app-test-module-development');
  });
});

describe('getEventBusSnsTopicArn', () => {
  it('builds an sns topic arn from the account info and deployment context', () => {
    const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);

    expect(getEventBusSnsTopicArn('bus', config, 'test-module', 'development', 'test-app')).toBe(
      'arn:aws:sns:eu-west-1:111:bus-test-app-test-module-development',
    );
  });

  it('appends .fifo to the topic name for a FIFO bus', () => {
    const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);

    expect(getEventBusSnsTopicArn('bus', config, 'test-module', 'development', 'test-app', undefined, true)).toBe(
      'arn:aws:sns:eu-west-1:111:bus-test-app-test-module-development.fifo',
    );
  });
});

describe('stack names', () => {
  it('builds the base stack name from the config', () => {
    expect(getBaseStackName(buildTestQpqConfig())).toBe('test-app-test-module-development');
  });

  it('appends the feature to the base stack name', () => {
    expect(getBaseStackName(buildTestQpqConfig([], { feature: 'beta' }))).toBe('test-app-test-module-development-beta');
  });

  it.each([
    [getInfStackName, 'test-app-test-module-development-inf'],
    [getWebStackName, 'test-app-test-module-development-web'],
    [getApiStackName, 'test-app-test-module-development-api'],
  ])('suffixes the phase stack name', (fn: (config: QPQConfig) => string, expected: string) => {
    expect(fn(buildTestQpqConfig())).toBe(expected);
  });

  it('builds the bootstrap stack name without the module', () => {
    expect(getBootstrapStackName(buildTestQpqConfig())).toBe('test-app-development-bs');
  });

  it('builds a static account stack name - the account+region namespace is the key', () => {
    expect(getAccountStackName()).toBe('qpq-account');
  });

  it('builds the feature bootstrap stack name', () => {
    expect(getBootstrapStackName(buildTestQpqConfig([], { feature: 'beta' }))).toBe('test-app-development-beta-bs');
  });

  it('builds the domain stack name without the module', () => {
    expect(getDomainStackName(buildTestQpqConfig())).toBe('test-app-development-domain');
  });

  it('builds the feature domain stack name', () => {
    expect(getDomainStackName(buildTestQpqConfig([], { feature: 'beta' }))).toBe('test-app-development-beta-domain');
  });
});
