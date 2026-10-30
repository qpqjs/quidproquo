import { getPlatformActionProcessor } from '@qpqjs/actionprocessor-js';
import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';
import { getRouteAuthValidationActionProcessor } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getAiActionProcessor } from './ai';
import { getApiKeyValidationActionProcessor } from './apiKeyValidation';
import { getConfigActionProcessor } from './config';
import { getCryptoActionProcessor } from './crypto';
import { getEventBusActionProcessor } from './eventBus';
import { getFileActionProcessor } from './file';
import { getCoreActionProcessor } from './getCoreActionProcessor';
import { getGraphDatabaseActionProcessor } from './graphDatabase';
import { getKeyValueStoreActionProcessor } from './keyValueStore';
import { getMetricActionProcessor } from './metric';
import { getQueueActionProcessor } from './queue';
import { getSystemActionProcessor } from './system';
import { getUserDirectoryActionProcessor } from './userDirectory';
import { getUserScriptActionProcessor } from './userScript';

const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);
const dynamicModuleLoader = noopDynamicModuleLoader;

// The composer is the sum of its parts: every processor each part registers is reachable
// through it, and none is shadowed by a later part.
describe('getCoreActionProcessor', () => {
  it('composes every processor of its parts', async () => {
    const parts = await Promise.all([
      getPlatformActionProcessor('aws')(qpqConfig, dynamicModuleLoader),
      getAiActionProcessor(qpqConfig, dynamicModuleLoader),
      getApiKeyValidationActionProcessor(qpqConfig, dynamicModuleLoader),
      getFileActionProcessor(qpqConfig, dynamicModuleLoader),
      getKeyValueStoreActionProcessor(qpqConfig, dynamicModuleLoader),
      getMetricActionProcessor(qpqConfig, dynamicModuleLoader),
      getQueueActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserDirectoryActionProcessor(qpqConfig, dynamicModuleLoader),
      getEventBusActionProcessor(qpqConfig, dynamicModuleLoader),
      getSystemActionProcessor(qpqConfig, dynamicModuleLoader),
      getConfigActionProcessor(qpqConfig, dynamicModuleLoader),
      getCryptoActionProcessor(qpqConfig, dynamicModuleLoader),
      getGraphDatabaseActionProcessor(qpqConfig, dynamicModuleLoader),
      getRouteAuthValidationActionProcessor(qpqConfig, dynamicModuleLoader),
      getUserScriptActionProcessor(qpqConfig, dynamicModuleLoader),
    ]);
    const expected = parts.flatMap((part) => Object.keys(part));

    const composed = await getCoreActionProcessor(qpqConfig, dynamicModuleLoader);

    expect(Object.keys(composed).sort()).toEqual([...new Set(expected)].sort());
    expect(expected.length).toBe(new Set(expected).size);
  });
});
