import { describe, expect, it } from 'vitest';

import { PackageInfo, pinSitePackageJson, SitePackageJson } from './sitePinQpq';

const packages: PackageInfo[] = [
  { name: '@qpqjs/core', version: '0.5.1' },
  { name: '@qpqjs/cli', version: '0.5.1' },
  { name: 'quidproquo', version: '0.5.1' },
];

const site: SitePackageJson = {
  name: 'quidproquojs.com',
  dependencies: {
    '@qpqjs/core': 'file:../packages/core',
    quidproquo: 'file:../packages/quidproquo',
    react: '^19.0.0',
  },
  devDependencies: {
    '@qpqjs/cli': 'file:../packages/cli',
    vitest: '^4.0.0',
  },
};

describe('pinSitePackageJson', () => {
  it('replaces every monorepo file link with the published version and leaves the rest alone', () => {
    const { packageJson, version, pinned } = pinSitePackageJson(site, packages);

    expect(version).toBe('0.5.1');
    expect(pinned).toEqual(['@qpqjs/core', 'quidproquo', '@qpqjs/cli']);
    expect(packageJson.dependencies).toEqual({ '@qpqjs/core': '0.5.1', quidproquo: '0.5.1', react: '^19.0.0' });
    expect(packageJson.devDependencies).toEqual({ '@qpqjs/cli': '0.5.1', vitest: '^4.0.0' });
    expect(packageJson.name).toBe('quidproquojs.com');
  });

  it('does not change the input', () => {
    pinSitePackageJson(site, packages);

    expect(site.dependencies?.['@qpqjs/core']).toBe('file:../packages/core');
  });

  it('refuses a half applied bump', () => {
    const mixed = [...packages, { name: '@qpqjs/web', version: '0.5.0' }];

    expect(() => pinSitePackageJson(site, mixed)).toThrow('carry 2 versions');
  });

  it('refuses a file link to a package npm does not serve', () => {
    const withPrivate: SitePackageJson = { dependencies: { '@qpqjs/secret-tools': 'file:../packages/secret-tools' } };

    expect(() => pinSitePackageJson(withPrivate, packages)).toThrow('not a public workspace package');
  });

  it('refuses a site with nothing to pin', () => {
    expect(() => pinSitePackageJson({ dependencies: { react: '^19.0.0' } }, packages)).toThrow('no file:../packages/');
  });
});
