import { QpqFunctionRuntimeAdvanced } from '@qpqjs/core';
import { RouteQPQWebServerConfigSetting } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { defineMcpServer } from './defineMcpServer';

describe('defineMcpServer', () => {
  it('authenticates the POST route against the user directory and gives it no feature globals', () => {
    const post = (defineMcpServer({ userDirectoryName: 'users' }) as RouteQPQWebServerConfigSetting[]).find((setting) => setting.method === 'POST');

    expect(post?.options.routeAuthSettings?.userDirectoryName).toBe('users');
    expect((post?.runtime as QpqFunctionRuntimeAdvanced).globals).toBeUndefined();
  });

  it('attaches auth processor overrides to the POST route only', () => {
    const auth = { basePath: '/svc/src', relativePath: '/mcpAuth', functionName: 'getMcpAuthProcessors' };
    const routes = defineMcpServer({ userDirectoryName: 'users', actionProcessors: [auth] }) as RouteQPQWebServerConfigSetting[];
    const post = routes.find((setting) => setting.method === 'POST');
    const get = routes.find((setting) => setting.method === 'GET');

    expect((post?.runtime as QpqFunctionRuntimeAdvanced).actionProcessors).toEqual([auth]);
    expect((get?.runtime as QpqFunctionRuntimeAdvanced).actionProcessors).toBeUndefined();
  });
});
