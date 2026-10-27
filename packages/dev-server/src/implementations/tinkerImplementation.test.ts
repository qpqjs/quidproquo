import { buildTestQpqConfig } from 'quidproquo-core';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTinkerInterface } from './tinkerImplementation';

vi.mock('../actionProcessor', () => ({
  getDevServerActionProcessors: async () => ({}),
}));

vi.mock('./logger', () => ({
  getDevServerLogger: () => ({
    enableLogs: async () => {},
    log: () => {},
    waitToFinishWriting: async () => {},
    moveToPermanentStorage: async () => {},
  }),
}));

const buildDevServerConfig = (): any => ({
  qpqConfigs: [buildTestQpqConfig([], { moduleName: 'svc-a' }), buildTestQpqConfig([], { moduleName: 'svc-b' })],
  dynamicModuleLoader: vi.fn(),
});

describe('createTinkerInterface', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => vi.restoreAllMocks());

  it('defaults the current service to the first service when no initial service is given', () => {
    const tinker = createTinkerInterface(buildDevServerConfig());

    expect(tinker.getCurrentService()).toBe('svc-a');
  });

  it('uses tinkerOptions.initialService when provided', () => {
    const tinker = createTinkerInterface(buildDevServerConfig(), { initialService: 'svc-b' });

    expect(tinker.getCurrentService()).toBe('svc-b');
  });

  it('lists the module names of all configs', () => {
    const tinker = createTinkerInterface(buildDevServerConfig());

    expect(tinker.getServices()).toEqual(['svc-a', 'svc-b']);
  });

  it('switches to a valid service', () => {
    const tinker = createTinkerInterface(buildDevServerConfig());

    tinker.switchService('svc-b');

    expect(tinker.getCurrentService()).toBe('svc-b');
  });

  it('throws when switching to an unknown service', () => {
    const tinker = createTinkerInterface(buildDevServerConfig());

    expect(() => tinker.switchService('nope')).toThrow("Service 'nope' not found");
  });

  it('returns the config for the current service', () => {
    const devServerConfig = buildDevServerConfig();
    const tinker = createTinkerInterface(devServerConfig, { initialService: 'svc-b' });

    expect(tinker.getServiceConfig()).toBe(devServerConfig.qpqConfigs[1]);
  });

  it('throws from getServiceConfig when the current service is not in the configs', () => {
    const tinker = createTinkerInterface(buildDevServerConfig(), { initialService: 'missing' });

    expect(() => tinker.getServiceConfig()).toThrow("Service 'missing' not found");
  });

  it('runs a trivial story through the real runtime and returns its result', async () => {
    const tinker = createTinkerInterface(buildDevServerConfig());

    const result = await tinker.run(function* () {
      return 'hello';
    } as any);

    expect(result.result).toBe('hello');
  });
});
