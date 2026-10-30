import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, describe, expect, it } from 'vitest';

import { getAppServiceNames } from './getAppServiceNames';
import { getAvailableAppNames } from './getAvailableAppNames';
import { getBackendServiceNames } from './getBackendServiceNames';
import { getDefaultAppName } from './getDefaultAppName';
import { getServiceDirectoryNames } from './getServiceDirectoryNames';
import { getServiceNamesWithViews } from './getServiceNamesWithViews';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-discovery-'));
const mk = (...parts: string[]) => fs.mkdirSync(path.join(root, ...parts), { recursive: true });

mk('apps', 'shop', 'services', 'api', 'service', 'src');
fs.writeFileSync(path.join(root, 'apps', 'shop', 'services', 'api', 'service', 'src', 'infrastructure.ts'), '');
mk('apps', 'shop', 'services', 'web', 'service');
mk('apps', 'shop', 'services', 'web', 'views');
mk('apps', 'shop', 'services', 'notes');
mk('apps', 'docs');

afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

describe('workspace discovery', () => {
  it('finds the apps that have services, and the first as the default', () => {
    expect(getAvailableAppNames(root)).toEqual(['shop']);
    expect(getDefaultAppName(root)).toBe('shop');
    expect(getDefaultAppName(path.join(root, 'nowhere'))).toBeNull();
  });

  it('lists service folders, backends, frontends and deployable services', () => {
    expect(getServiceDirectoryNames(root, 'shop')).toEqual(['api', 'notes', 'web']);
    expect(getBackendServiceNames(root, 'shop')).toEqual(['api', 'web']);
    expect(getServiceNamesWithViews(root, 'shop')).toEqual(['web']);
    expect(getAppServiceNames(root, 'shop')).toEqual(['api']);
  });
});
