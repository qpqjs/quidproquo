import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { DynamicFunctionsActionType, FileActionType, UserScriptActionType } from '@qpqjs/core';
import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { getDevServerActionProcessors } from './getDevServerActionProcessors';

const { repo } = vi.hoisted(() => ({
  repo: { get: vi.fn(), delete: vi.fn(), query: vi.fn(), scan: vi.fn(), update: vi.fn(), upsert: vi.fn() },
}));

vi.mock('../logic/keyValueStore/getKvsRepository', () => ({
  getKvsRepository: vi.fn(() => repo),
}));

// The lambda processors beneath still resolve AWS deploy config at list-build time.
const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);

const devServerConfig = {
  runtimePath: '/tmp/runtime',
  fileStorageConfig: {
    storagePath: '/tmp/files',
    secureUrlHost: 'localhost',
    secureUrlPort: 4000,
    secureUrlPublicPort: 4000,
    secureUrlSecret: 'secret',
  },
} as any;

describe('getDevServerActionProcessors', () => {
  // The dev server starts from the lambda processor list, so a processor the node
  // package adds (dynamic functions, user scripts) reaches the dev server with no
  // wiring of its own, alongside the dev server's local file processors.
  it('composes the node-only processors alongside the dev-server overrides', async () => {
    const processors = await getDevServerActionProcessors(qpqConfig, noopDynamicModuleLoader, devServerConfig);

    expect(processors[FileActionType.ReadTextContents]).toBeDefined();
    expect(processors[DynamicFunctionsActionType.Execute]).toBeDefined();
    expect(processors[UserScriptActionType.Execute]).toBeDefined();
    // Building is opt-in per service through defineUserScriptBuilder, never in the base list.
    expect(processors[UserScriptActionType.Build]).toBeUndefined();
  });
});
