import { FEDERATED_SHARED_PACKAGE_NAMES } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { createUserScriptExternals } from './createUserScriptExternals';

const resolveAsync = (request: string, issuer?: string, hostModuleNames: string[] = []) =>
  new Promise<{ error?: Error; result?: string }>((done) => {
    createUserScriptExternals(hostModuleNames)({ request, context: '/project', contextInfo: { issuer, issuerLayer: null } } as any, (error, result) =>
      done({ error, result }),
    );
  });

describe('createUserScriptExternals', () => {
  it.each([...FEDERATED_SHARED_PACKAGE_NAMES])('leaves the shared package %s external as commonjs', async (name: any) => {
    expect(await resolveAsync(name)).toEqual({ error: undefined, result: `commonjs ${name}` });
  });

  it("leaves the service's own script modules external, and only those", async () => {
    expect(await resolveAsync('my-sdk/v1', undefined, ['my-sdk/v1'])).toEqual({ error: undefined, result: 'commonjs my-sdk/v1' });
    expect(await resolveAsync('my-sdk/v1')).toEqual({ error: undefined, result: undefined });
  });

  it.each(['fs', 'node:fs', 'path', 'crypto'])('refuses the Node builtin %s, naming the importer', async (name: any) => {
    const { error, result } = await resolveAsync(name, '/project/src/main.ts');

    expect(result).toBeUndefined();
    expect(error?.message).toContain(`[/project/src/main.ts] imports the Node builtin [${name}]`);
  });

  it('refuses a subpath import of a shared package', async () => {
    const { error } = await resolveAsync('@qpqjs/core/lib/commonjs/index');

    expect(error?.message).toContain('import the package root instead');
  });

  it('leaves everything else to be bundled', async () => {
    expect(await resolveAsync('lodash')).toEqual({ error: undefined, result: undefined });
    expect(await resolveAsync('./helpers/formatSum')).toEqual({ error: undefined, result: undefined });
  });

  it('does nothing for an empty request', async () => {
    expect(await resolveAsync('')).toEqual({ error: undefined, result: undefined });
  });
});
