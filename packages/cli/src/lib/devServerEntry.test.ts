import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';

import { writeDevServerEntry, writeUserScriptChildEntry } from './devServerEntry';

const makeRoot = (): string => fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-entry-'));

describe('writeDevServerEntry', () => {
  it('serves only by default', () => {
    const entry = fs.readFileSync(writeDevServerEntry(makeRoot(), 'app'), 'utf8');

    expect(entry).toContain("import { startDevServer } from '@qpqjs/dev-server';");
    expect(entry).toContain('startDevServer(devServerConfig, devServerConfigOverrides);');
    expect(entry).not.toContain('runMigrations(');
  });

  it('migrates once and exits in migrate mode, in its own file', () => {
    const root = makeRoot();
    const entryPath = writeDevServerEntry(root, 'app', 'migrate');
    const entry = fs.readFileSync(entryPath, 'utf8');

    expect(path.basename(entryPath)).toBe('migrate.entry.ts');
    expect(entry).toContain('runMigrations(devServerConfig, devServerConfigOverrides)');
    expect(entry).toContain('process.exit(0);');
    expect(entry).not.toContain('startDevServer(');
  });

  it('migrates then serves for the image', () => {
    const entry = fs.readFileSync(writeDevServerEntry(makeRoot(), 'app', 'migrate-then-serve'), 'utf8');

    expect(entry).toContain("import { runMigrations, startDevServer } from '@qpqjs/dev-server';");
    expect(entry).toContain('runMigrations(devServerConfig, devServerConfigOverrides)');
    expect(entry).toContain('return startDevServer(devServerConfig, devServerConfigOverrides);');
    expect(entry).not.toContain('process.exit(0)');
  });

  it('reads the public host from the environment for secure file urls', () => {
    const entry = fs.readFileSync(writeDevServerEntry(makeRoot(), 'app'), 'utf8');

    expect(entry).toContain("secureUrlHost: process.env.QPQ_PUBLIC_HOST || 'localhost'");
    expect(entry).toContain('secureUrlPublicPort: Number(process.env.QPQ_PUBLIC_FILE_STORAGE_PORT) || undefined');
  });

  it('points the server at the user-script child bundle beside it', () => {
    const entry = fs.readFileSync(writeDevServerEntry(makeRoot(), 'app'), 'utf8');

    expect(entry).toContain("userScriptChildModulePath: path.join(path.dirname(process.argv[1]), \"user-script-child.js\")");
  });
});

describe('writeUserScriptChildEntry', () => {
  it('writes a child entry that serves the service named on its command line', () => {
    const entryPath = writeUserScriptChildEntry(makeRoot());
    const entry = fs.readFileSync(entryPath, 'utf8');

    expect(path.basename(entryPath)).toBe('user-script-child.entry.ts');
    expect(entry).toContain('const serviceName = process.argv[2];');
    expect(entry).toContain('runUserScriptChildMain(qpqConfig, (runtime) => qpqDynamicModuleLoaderForService(serviceName, runtime));');
    expect(entry).toContain('main();');
  });
});
