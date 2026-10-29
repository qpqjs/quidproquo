import { QpqRuntimeType } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import fs from 'fs';
import path from 'path';
import * as repl from 'repl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createTinkerInterface } from './tinkerImplementation';

vi.mock('repl', () => ({
  start: vi.fn(() => ({
    context: {},
    setupHistory: vi.fn(),
    defineCommand: vi.fn(),
    setPrompt: vi.fn(),
    on: vi.fn(),
    displayPrompt: vi.fn(),
  })),
}));

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
  runtimePath: '/tmp/qpq-tinker-test-runtime',
});

const shippedRuntimePackages = ['core', 'webserver', 'actionprocessor-aws', 'actionprocessor-node', 'actionprocessor-js', 'deploy-aws'];

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

  // Security regression: a tinker run is the developer's own terminal, never a request. It starts with no caller
  // identity, an empty context and the tinker tag, so a story that checks auth sees an anonymous service-function run.
  it('runs stories with no access token, an empty context and the tinker tag', async () => {
    const tinker = createTinkerInterface(buildDevServerConfig());

    const result = await tinker.run(function* () {
      return 'hello';
    } as any);

    expect(result.session.accessToken).toBeUndefined();
    expect(result.session.decodedAccessToken).toBeUndefined();
    expect(result.session.context).toEqual({});
    expect(result.tags).toContain('tinker');
    expect(result.runtimeType).toBe(QpqRuntimeType.SERVICE_FUNCTION_EXE);
    expect(result.correlation).toMatch(/^svc-a::tinker-/);
  });

  // Security regression: the REPL reads the process's own stdin and writes its stdout; it never takes a socket, so there
  // is no network path into arbitrary story execution.
  it('starts the repl on the process stdio, never on a socket', () => {
    const tinker = createTinkerInterface(buildDevServerConfig());

    tinker.startRepl();

    const options = vi.mocked(repl.start).mock.calls[0][0] as Record<string, unknown>;
    expect(options.input).toBeUndefined();
    expect(options.output).toBeUndefined();
    expect(typeof options.eval).toBe('function');
  });

  // Security regression: the history of what was typed (which can include literal secrets or passwords) lives under the
  // gitignored runtime folder, not in the project root where it would be committed.
  it('keeps the repl history under the runtime folder', () => {
    const devServerConfig = buildDevServerConfig();
    const tinker = createTinkerInterface(devServerConfig);

    tinker.startRepl();

    const replServer = vi.mocked(repl.start).mock.results[0].value;
    const historyPath = vi.mocked(replServer.setupHistory).mock.calls[0][0] as string;
    expect(path.relative(devServerConfig.runtimePath, historyPath).startsWith('..')).toBe(false);
    expect(path.isAbsolute(historyPath)).toBe(true);
  });

  // Security regression: tinker ships only in the dev server; no runtime or deploy package depends on it, so a deployed
  // lambda can never carry the REPL.
  it('is not a dependency of any shipped runtime package', () => {
    for (const packageName of shippedRuntimePackages) {
      const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../../${packageName}/package.json`), 'utf8'));
      const dependencies = Object.keys({ ...packageJson.dependencies, ...packageJson.peerDependencies });

      expect(dependencies, packageName).not.toContain('@qpqjs/dev-server');
    }
  });
});
