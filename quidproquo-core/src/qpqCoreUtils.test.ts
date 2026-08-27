import { describe, expect, it } from 'vitest';

import {
  defineActionProcessors,
  defineAi,
  defineApiBuildPath,
  defineApplication,
  defineDeployEvent,
  defineEnvironmentSettings,
  defineEventBus,
  defineGlobal,
  defineGraphDatabase,
  defineInlineFunction,
  defineKeyValueStore,
  defineModule,
  defineNotifyError,
  defineParameter,
  defineQueue,
  defineRecurringSchedule,
  defineSecret,
  defineServiceSettings,
  defineStorageDrive,
  defineUserDirectory,
  defineVirtualNetwork,
  QPQCoreConfigSettingType,
} from './config';
import {
  assertFifoQueueEventBusSubscriptionsAreValid,
  convertCustomFullyQualifiedResourceToGeneric,
  flattenQpqConfig,
  getActionProcessorSources,
  getAllAiConfigs,
  getAllEventBusConfigs,
  getAllGraphDatabaseConfigs,
  getAllInlineFunctions,
  getAllKeyValueStores,
  getAllParameterConfigs,
  getAllSecretConfigs,
  getAllSrcEntries,
  getApiBuildPath,
  getApplicationConfigRoot,
  getApplicationConfigSetting,
  getApplicationModuleEnvironment,
  getApplicationModuleFeature,
  getApplicationModuleName,
  getApplicationName,
  getConfigRoot,
  getConfigSetting,
  getConfigSettings,
  getDeployEventConfigs,
  getEventBusConfigByName,
  getFullUrlFromConfigUrl,
  getFullyQualifiedResourceName,
  getGlobalConfigValue,
  getKeyValueStoreByName,
  getKeyValueStoreFullyQualifiedResourceName,
  getNotifyErrorConfigs,
  getOwnedEventBusConfigs,
  getOwnedGraphDatabases,
  getOwnedInlineFunctions,
  getOwnedItems,
  getOwnedKeyValueStores,
  getOwnedParameterConfigs,
  getOwnedQueues,
  getOwnedScheduleEvents,
  getOwnedSecrets,
  getOwnedStorageDrives,
  getOwnedUserDirectories,
  getParameterConfig,
  getQueueByName,
  getQueueQueueProcessors,
  getQueues,
  getQueueSrcEntries,
  getScheduleEvents,
  getSecretByName,
  getSrcFilenameFromQpqFunctionRuntime,
  getStorageDriveByName,
  getStorageDriveNames,
  getStorageDrives,
  getUniqueKeyForSetting,
  getUserDirectories,
  getUserDirectoryByName,
  getUserDirectoryEmailTemplates,
  getUserDirectorySrcEntries,
  getVirualNetworkConfigs,
  isSameResource,
  resolveCrossServiceResourceName,
  resolveGlobalValue,
} from './qpqCoreUtils';
import { buildTestQpqConfig } from './testing';

describe('qpqCoreUtils', () => {
  describe('flattenQpqConfig', () => {
    it('flattens nested config arrays into a single list', () => {
      const config = buildTestQpqConfig([[defineSecret('a')], defineSecret('b')]);

      const secrets = getAllSecretConfigs(config);
      expect(secrets.map((s) => s.key)).toEqual(['a', 'b']);
    });

    it('resolves environmentSettings for the active environment', () => {
      const config = buildTestQpqConfig(
        [
          defineEnvironmentSettings({
            development: [defineSecret('devSecret')],
            production: [defineSecret('prodSecret')],
          }),
        ],
        { environment: 'development' },
      );

      expect(getAllSecretConfigs(config).map((s) => s.key)).toEqual(['devSecret']);
    });

    it('falls back to the * environment key when the environment has no entry', () => {
      const config = buildTestQpqConfig(
        [
          defineEnvironmentSettings({
            '*': [defineSecret('anySecret')],
          }),
        ],
        { environment: 'staging' },
      );

      expect(getAllSecretConfigs(config).map((s) => s.key)).toEqual(['anySecret']);
    });

    it('resolves serviceSettings for the active module', () => {
      const config = buildTestQpqConfig(
        [
          defineServiceSettings({
            'test-module': [defineSecret('svcSecret')],
            'other-module': [defineSecret('otherSecret')],
          }),
        ],
        { moduleName: 'test-module' },
      );

      expect(getAllSecretConfigs(config).map((s) => s.key)).toEqual(['svcSecret']);
    });

    it('throws when serviceSettings is used without a module', () => {
      expect(() => flattenQpqConfig([defineServiceSettings({ '*': [defineSecret('x')] })])).toThrow(/requires a module/);
    });
  });

  describe('getConfigSettings / getConfigSetting', () => {
    it('returns all settings of a type', () => {
      const config = buildTestQpqConfig([defineSecret('a'), defineSecret('b')]);

      expect(getConfigSettings(config, QPQCoreConfigSettingType.secret)).toHaveLength(2);
    });

    it('returns the first setting of a type, or undefined when none exist', () => {
      const config = buildTestQpqConfig([defineSecret('a')]);

      expect(getConfigSetting(config, QPQCoreConfigSettingType.secret)?.uniqueKey).toBe('a');
      expect(getConfigSetting(config, QPQCoreConfigSettingType.queue)).toBeUndefined();
    });
  });

  describe('application accessors', () => {
    it('reads application name, module, configRoot and feature', () => {
      const config = buildTestQpqConfig([], {
        applicationName: 'my-app',
        moduleName: 'my-module',
        configRoot: '/root',
        feature: 'beta',
      });

      expect(getApplicationName(config)).toBe('my-app');
      expect(getApplicationModuleName(config)).toBe('my-module');
      expect(getApplicationConfigRoot(config)).toBe('/root');
      expect(getConfigRoot(config)).toBe('/root');
      expect(getApplicationModuleFeature(config)).toBe('beta');
      expect(getApplicationConfigSetting(config).applicationName).toBe('my-app');
    });

    it('returns the environment, falling back to production when unset', () => {
      expect(getApplicationModuleEnvironment(buildTestQpqConfig([], { environment: 'production' }))).toBe('production');
      expect(getApplicationModuleEnvironment(buildTestQpqConfig([], { environment: '' }))).toBe('production');
    });

    it('throws when the application setting is missing', () => {
      expect(() => getApplicationName([defineModule('m')])).toThrow(/defineApplication/);
    });

    it('throws when the module setting is missing', () => {
      expect(() => getApplicationModuleName([defineApplication('a', 'development', './')])).toThrow(/defineModule/);
    });
  });

  describe('getApiBuildPath', () => {
    it('returns the configured api build path', () => {
      expect(getApiBuildPath(buildTestQpqConfig([], { apiBuildPath: '/out' }))).toBe('/out');
    });

    it('throws when no build path is configured', () => {
      expect(() => getApiBuildPath([defineApplication('a', 'development', './'), defineModule('m')])).toThrow();
    });
  });

  describe('storage drives', () => {
    const config = buildTestQpqConfig([defineStorageDrive('uploads'), defineStorageDrive('cache')]);

    it('lists storage drives and their names', () => {
      expect(getStorageDrives(config)).toHaveLength(2);
      expect(getStorageDriveNames(config)).toEqual(['uploads', 'cache']);
    });

    it('finds a storage drive by name', () => {
      expect(getStorageDriveByName('uploads', config)?.storageDrive).toBe('uploads');
      expect(getStorageDriveByName('missing', config)).toBeUndefined();
    });

    it('returns only owned storage drives', () => {
      const mixed = buildTestQpqConfig([
        defineStorageDrive('mine'),
        defineStorageDrive('theirs', { owner: { module: 'other-module', storageDriveName: 'theirs' } }),
      ]);

      expect(getOwnedStorageDrives(mixed).map((s) => s.storageDrive)).toEqual(['mine']);
    });
  });

  describe('queues', () => {
    const config = buildTestQpqConfig([defineQueue('jobs', { created: '/q/created::run' })]);

    it('lists queues and finds by name', () => {
      expect(getQueues(config)).toHaveLength(1);
      expect(getQueueByName(config, 'jobs')?.name).toBe('jobs');
      expect(getQueueByName(config, 'missing')).toBeUndefined();
    });

    it('returns queue processors, or empty for unknown queues', () => {
      expect(getQueueQueueProcessors('jobs', config)).toEqual({ created: '/q/created::run' });
      expect(getQueueQueueProcessors('missing', config)).toEqual({});
    });

    it('collects queue processor runtimes as src entries', () => {
      expect(getQueueSrcEntries(config)).toEqual(['/q/created::run']);
    });

    it('returns owned queues (queues carry no owner so all are owned)', () => {
      const config = buildTestQpqConfig([defineQueue('a', {}), defineQueue('b', {})]);
      expect(getOwnedQueues(config).map((q) => q.name)).toEqual(['a', 'b']);
    });
  });

  describe('assertFifoQueueEventBusSubscriptionsAreValid', () => {
    it('throws when a FIFO queue subscribes to a standard event bus', () => {
      const config = buildTestQpqConfig([defineEventBus('bus'), defineQueue('jobs', {}, { isFifo: true, eventBusSubscriptions: ['bus'] })]);

      expect(() => assertFifoQueueEventBusSubscriptionsAreValid(config)).toThrow('queue [jobs] -> event bus [bus]');
    });

    it('throws when a FIFO queue subscribes to a bus that does not exist', () => {
      const config = buildTestQpqConfig([defineQueue('jobs', {}, { isFifo: true, eventBusSubscriptions: ['missing'] })]);

      expect(() => assertFifoQueueEventBusSubscriptionsAreValid(config)).toThrow('queue [jobs] -> event bus [missing]');
    });

    it('accepts a FIFO queue subscribed to a FIFO event bus', () => {
      const config = buildTestQpqConfig([
        defineEventBus('bus', { isFifo: true }),
        defineQueue('jobs', {}, { isFifo: true, eventBusSubscriptions: ['bus'] }),
      ]);

      expect(() => assertFifoQueueEventBusSubscriptionsAreValid(config)).not.toThrow();
    });

    it('ignores standard queues entirely', () => {
      const config = buildTestQpqConfig([defineEventBus('bus'), defineQueue('jobs', {}, { eventBusSubscriptions: ['bus'] })]);

      expect(() => assertFifoQueueEventBusSubscriptionsAreValid(config)).not.toThrow();
    });
  });

  describe('getOwnedItems', () => {
    const ownedHere = defineSecret('mine');
    const foreignModule = defineSecret('foreignModule', { owner: { module: 'other-module', secretName: 'foreignModule' } });
    const foreignApp = defineSecret('foreignApp', { owner: { application: 'other-app', secretName: 'foreignApp' } });

    it('keeps settings with no owner and settings owned by the current context', () => {
      const config = buildTestQpqConfig([ownedHere, foreignModule, foreignApp], { applicationName: 'test-app', moduleName: 'test-module' });

      const owned = getOwnedItems(getAllSecretConfigs(config), config);
      expect(owned.map((s) => s.key)).toEqual(['mine']);
    });

    it('filters by feature and environment', () => {
      const featured = defineSecret('featured', { owner: { feature: 'beta', secretName: 'featured' } });
      const config = buildTestQpqConfig([featured], { feature: 'beta' });

      expect(getOwnedItems(getAllSecretConfigs(config), config).map((s) => s.key)).toEqual(['featured']);

      const noFeatureConfig = buildTestQpqConfig([featured]);
      expect(getOwnedItems(getAllSecretConfigs(noFeatureConfig), noFeatureConfig)).toEqual([]);
    });
  });

  describe('key value stores', () => {
    const config = buildTestQpqConfig([defineKeyValueStore('users', 'id'), defineKeyValueStore('sessions', 'id')]);

    it('lists all key value stores and finds by name', () => {
      expect(getAllKeyValueStores(config)).toHaveLength(2);
      expect(getKeyValueStoreByName(config, 'users')?.keyValueStoreName).toBe('users');
      expect(getKeyValueStoreByName(config, 'missing')).toBeUndefined();
    });

    it('returns only owned key value stores', () => {
      const mixed = buildTestQpqConfig([
        defineKeyValueStore('mine', 'id'),
        defineKeyValueStore('theirs', 'id', [], { owner: { module: 'other-module' } }),
      ]);

      expect(getOwnedKeyValueStores(mixed).map((k) => k.keyValueStoreName)).toEqual(['mine']);
    });

    it('builds a fully qualified resource name for a store', () => {
      const fqr = getKeyValueStoreFullyQualifiedResourceName('users', config);
      expect(fqr).toEqual({
        resourceName: 'users',
        application: 'test-app',
        environment: 'development',
        module: 'test-module',
        feature: '',
      });
    });
  });

  describe('getFullyQualifiedResourceName', () => {
    it('uses the application context when no config setting is given', () => {
      const config = buildTestQpqConfig([], { applicationName: 'app', moduleName: 'mod', environment: 'production', feature: 'f1' });

      expect(getFullyQualifiedResourceName(config, 'thing')).toEqual({
        resourceName: 'thing',
        application: 'app',
        environment: 'production',
        module: 'mod',
        feature: 'f1',
      });
    });

    it('prefers owner overrides from the config setting', () => {
      const config = buildTestQpqConfig();
      const setting = defineSecret('local', {
        owner: { module: 'shared', application: 'shared-app', secretName: 'realName' },
      });

      expect(getFullyQualifiedResourceName(config, 'local', setting)).toEqual({
        resourceName: 'realName',
        application: 'shared-app',
        environment: 'development',
        module: 'shared',
        feature: '',
      });
    });
  });

  describe('isSameResource', () => {
    const base = { resourceName: 'r', application: 'a', environment: 'e', module: 'm', feature: 'f' };

    it('is true for matching resources and false otherwise', () => {
      expect(isSameResource(base, { ...base })).toBe(true);
      expect(isSameResource(base, { ...base, resourceName: 'other' })).toBe(false);
      expect(isSameResource(base, { ...base, module: 'other' })).toBe(false);
    });
  });

  describe('resolveCrossServiceResourceName', () => {
    it('wraps a string into a name object', () => {
      expect(resolveCrossServiceResourceName('foo')).toEqual({ name: 'foo' });
    });

    it('passes an object through unchanged', () => {
      const input = { name: 'foo', service: 'svc' };
      expect(resolveCrossServiceResourceName(input)).toBe(input);
    });
  });

  describe('convertCustomFullyQualifiedResourceToGeneric', () => {
    it('maps the custom key to resourceName', () => {
      const result = convertCustomFullyQualifiedResourceToGeneric({
        module: 'm',
        application: 'a',
        feature: 'f',
        environment: 'e',
        queueName: 'jobs',
      });

      expect(result).toEqual({ module: 'm', application: 'a', feature: 'f', environment: 'e', resourceName: 'jobs' });
    });
  });

  describe('secrets', () => {
    const config = buildTestQpqConfig([
      defineSecret('apiKey'),
      defineSecret('foreign', { owner: { module: 'other-module', secretName: 'foreign' } }),
    ]);

    it('lists all secrets and finds one by name', () => {
      expect(getAllSecretConfigs(config)).toHaveLength(2);
      expect(getSecretByName('apiKey', config).key).toBe('apiKey');
    });

    it('throws when a secret is not found', () => {
      expect(() => getSecretByName('missing', config)).toThrow(/Can not find secret/);
    });

    it('returns only owned secrets', () => {
      expect(getOwnedSecrets(config).map((s) => s.key)).toEqual(['apiKey']);
    });
  });

  describe('parameters', () => {
    const config = buildTestQpqConfig([
      defineParameter('region', { value: 'us-east-1' }),
      defineParameter('foreign', { owner: { module: 'other-module', parameterName: 'foreign' } }),
    ]);

    it('lists all parameters and finds one by name', () => {
      expect(getAllParameterConfigs(config)).toHaveLength(2);
      expect(getParameterConfig('region', config).value).toBe('us-east-1');
    });

    it('throws when a parameter is not found', () => {
      expect(() => getParameterConfig('missing', config)).toThrow(/not found/);
    });

    it('returns only owned parameters', () => {
      expect(getOwnedParameterConfigs(config).map((p) => p.key)).toEqual(['region']);
    });
  });

  describe('globals', () => {
    const config = buildTestQpqConfig([defineGlobal('featureFlag', true), defineGlobal('count', 42)]);

    it('reads a global value by name', () => {
      expect(getGlobalConfigValue<boolean>(config, 'featureFlag')).toBe(true);
      expect(getGlobalConfigValue<number>(config, 'count')).toBe(42);
    });

    it('throws when the global is not found', () => {
      expect(() => getGlobalConfigValue(config, 'missing')).toThrow(/not found/);
    });

    it('resolveGlobalValue prefers function globals over config globals', () => {
      expect(resolveGlobalValue(config, { featureFlag: false }, 'featureFlag')).toBe(false);
      expect(resolveGlobalValue(config, undefined, 'featureFlag')).toBe(true);
      expect(resolveGlobalValue(config, {}, 'featureFlag')).toBe(true);
    });
  });

  describe('user directories', () => {
    const config = buildTestQpqConfig([
      defineUserDirectory('main', { emailTemplates: { verifyEmail: '/ud/verify::run' } }),
      defineUserDirectory('foreign', { owner: { module: 'other-module', userDirectoryName: 'foreign' } }),
    ]);

    it('lists directories and finds one by name', () => {
      expect(getUserDirectories(config)).toHaveLength(2);
      expect(getUserDirectoryByName('main', config).name).toBe('main');
    });

    it('throws when a directory is not found', () => {
      expect(() => getUserDirectoryByName('missing', config)).toThrow(/UserDirectory not found/);
    });

    it('returns only owned directories', () => {
      expect(getOwnedUserDirectories(config).map((u) => u.name)).toEqual(['main']);
    });

    it('maps email templates keyed by directory name', () => {
      const templates = getUserDirectoryEmailTemplates(config);
      expect(templates.main).toEqual({ verifyEmail: '/ud/verify::run', resetPassword: undefined, resetPasswordAdmin: undefined });
    });

    it('collects src entries from owned directories', () => {
      expect(getUserDirectorySrcEntries(config)).toEqual(['/ud/verify::run']);
    });
  });

  describe('event buses', () => {
    it('lists all event buses', () => {
      const config = buildTestQpqConfig([defineEventBus('orders'), defineEventBus('payments')]);
      expect(getAllEventBusConfigs(config)).toHaveLength(2);
    });

    it('finds an event bus by local name or by resource name override', () => {
      const config = buildTestQpqConfig([defineEventBus('local', { owner: { eventBusName: 'sharedBus' } })]);

      expect(getEventBusConfigByName('sharedBus', config)?.name).toBe('local');
      expect(getEventBusConfigByName('local', config)?.name).toBe('local');
      expect(getEventBusConfigByName('missing', config)).toBeUndefined();
    });

    it('returns only owned event buses', () => {
      const config = buildTestQpqConfig([
        defineEventBus('mine'),
        defineEventBus('theirs', { owner: { module: 'other-module', eventBusName: 'theirs' } }),
      ]);

      expect(getOwnedEventBusConfigs(config).map((e) => e.name)).toEqual(['mine']);
    });
  });

  describe('graph databases', () => {
    it('lists all and only owned graph databases', () => {
      const config = buildTestQpqConfig([
        defineGraphDatabase('mine', 'vpc'),
        defineGraphDatabase('theirs', 'vpc', { owner: { module: 'other-module', graphDatabaseName: 'theirs' } }),
      ]);

      expect(getAllGraphDatabaseConfigs(config)).toHaveLength(2);
      expect(getOwnedGraphDatabases(config).map((g) => g.name)).toEqual(['mine']);
    });
  });

  describe('simple type filters', () => {
    it('lists ai, virtual network, notify error and deploy event configs', () => {
      const config = buildTestQpqConfig([
        defineAi('assistant', {}),
        defineVirtualNetwork('vpc'),
        defineNotifyError('alarms', { onAlarm: {} }),
        defineDeployEvent('postDeploy', '/d/run::handler'),
      ]);

      expect(getAllAiConfigs(config).map((a) => a.aiName)).toEqual(['assistant']);
      expect(getVirualNetworkConfigs(config).map((v) => v.name)).toEqual(['vpc']);
      expect(getNotifyErrorConfigs(config).map((n) => n.name)).toEqual(['alarms']);
      expect(getDeployEventConfigs(config).map((d) => d.name)).toEqual(['postDeploy']);
    });
  });

  describe('schedules', () => {
    const config = buildTestQpqConfig([
      defineRecurringSchedule('cron(0 0 * * ? *)', '/s/daily::run'),
      defineRecurringSchedule('cron(0 1 * * ? *)', '/s/foreign::run', { owner: { module: 'other-module', recurringSchedule: 'foreign' } }),
    ]);

    it('lists all schedule events', () => {
      expect(getScheduleEvents(config)).toHaveLength(2);
    });

    it('returns only owned schedule events', () => {
      expect(getOwnedScheduleEvents(config).map((s) => s.runtime)).toEqual(['/s/daily::run']);
    });
  });

  describe('inline functions and src entries', () => {
    const config = buildTestQpqConfig([
      defineActionProcessors('/ap/get::handler'),
      defineRecurringSchedule('cron(0 0 * * ? *)', '/s/daily::run'),
      defineQueue('jobs', { created: '/q/created::run' }),
      defineInlineFunction('/inline/run::handler'),
    ]);

    it('lists action processor sources and inline functions', () => {
      expect(getActionProcessorSources(config)).toEqual(['/ap/get::handler']);
      expect(getAllInlineFunctions(config).map((f) => f.runtime)).toEqual(['/inline/run::handler']);
      expect(getOwnedInlineFunctions(config).map((f) => f.runtime)).toEqual(['/inline/run::handler']);
    });

    it('aggregates every buildable src entry', () => {
      const entries = getAllSrcEntries(config);
      expect(entries).toEqual(expect.arrayContaining(['/ap/get::handler', '/s/daily::run', '/q/created::run', '/inline/run::handler']));
    });

    it('sweeps runtime-attached action processor override sources into the entries', () => {
      // A missing override source here means the bundler never builds it, the deployed
      // bundle omits it, and the dynamic load fails at runtime.
      const overrideSource = { basePath: '/svc/src', relativePath: '/smoke/processors::getAuthOverrides', functionName: 'getAuthOverrides' };
      const withOverrides = buildTestQpqConfig([
        defineInlineFunction({
          basePath: '/svc/src',
          relativePath: '/inline/run::handler',
          functionName: 'handler',
          actionProcessors: [overrideSource],
        }),
      ]);

      expect(getAllSrcEntries(withOverrides)).toContainEqual(overrideSource);
    });

    it("includes a store's change-stream handler", () => {
      // Anything missing here is never bundled, so its handler cannot be resolved at runtime
      // and simply never runs. Nothing throws — the only symptom is whatever it maintained
      // quietly going stale, which is how this was found.
      const withStream = buildTestQpqConfig([
        defineKeyValueStore('events', 'pk', [], { onStream: { runtime: '/entry/kvsStream/project::project' } }),
      ]);

      expect(getAllSrcEntries(withStream)).toContain('/entry/kvsStream/project::project');
    });
  });

  describe('getSrcFilenameFromQpqFunctionRuntime', () => {
    it('extracts the filename from a relative runtime', () => {
      expect(getSrcFilenameFromQpqFunctionRuntime('/some/path/controller::onAuth')).toBe('controller');
    });

    it('extracts the last relative path segment from an advanced runtime', () => {
      expect(
        getSrcFilenameFromQpqFunctionRuntime({ basePath: '/base', relativePath: '/service/entry/admin::onUpdate', functionName: 'onUpdate' }),
      ).toBe('admin::onUpdate');
    });
  });

  describe('getUniqueKeyForSetting', () => {
    it('combines the trailing type segment with the unique key', () => {
      expect(getUniqueKeyForSetting(defineSecret('mySecret'))).toBe('secretmySecret');
    });
  });

  describe('getFullUrlFromConfigUrl', () => {
    it('passes a string url through unchanged', () => {
      expect(getFullUrlFromConfigUrl('https://example.com', buildTestQpqConfig())).toBe('https://example.com');
    });

    it('builds a bare url for production with no module/feature/path', () => {
      const config = buildTestQpqConfig([], { environment: 'production' });
      expect(getFullUrlFromConfigUrl({ protocol: 'https', domain: 'example.com' }, config)).toBe('https://example.com');
    });

    it('prefixes environment, feature, module and appends the path', () => {
      const config = buildTestQpqConfig([], { environment: 'development', feature: 'beta' });
      expect(getFullUrlFromConfigUrl({ protocol: 'http', domain: 'example.com', module: 'api', path: '/health' }, config)).toBe(
        'http://api.beta.development.example.com/health',
      );
    });
  });
});
