import path from 'path';
import { describe, expect, it } from 'vitest';

import { parseServiceDir } from './parseServiceDir';

const abs = (...parts: string[]) => path.join(path.sep, ...parts);

describe('parseServiceDir', () => {
  it('splits an apps service directory into root, app and service names', () => {
    const dir = abs('repo', 'apps', 'myapp', 'services', 'billing', 'service');

    expect(parseServiceDir(dir, 'service')).toEqual({
      root: abs('repo'),
      appName: 'myapp',
      serviceName: 'billing',
    });
  });

  it('parses a views directory with the views leaf', () => {
    const dir = abs('repo', 'apps', 'myapp', 'services', 'shell', 'views');

    expect(parseServiceDir(dir, 'views')).toEqual({
      root: abs('repo'),
      appName: 'myapp',
      serviceName: 'shell',
    });
  });

  it('uses the LAST apps segment when the repo root itself contains one', () => {
    const dir = abs('home', 'apps', 'repo', 'apps', 'myapp', 'services', 'billing', 'service');

    expect(parseServiceDir(dir, 'service')).toEqual({
      root: abs('home', 'apps', 'repo'),
      appName: 'myapp',
      serviceName: 'billing',
    });
  });

  it('throws when the directory does not match the convention', () => {
    expect(() => parseServiceDir(abs('repo', 'apps', 'myapp', 'billing', 'service'), 'service')).toThrow(/Expected apps/);
  });

  it('throws when the leaf segment does not match', () => {
    expect(() => parseServiceDir(abs('repo', 'apps', 'myapp', 'services', 'billing', 'views'), 'service')).toThrow(/Expected apps/);
  });
});
