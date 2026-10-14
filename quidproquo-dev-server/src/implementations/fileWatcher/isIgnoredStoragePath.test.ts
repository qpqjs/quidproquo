import { describe, expect, it } from 'vitest';

import { isIgnoredStoragePath } from './isIgnoredStoragePath';

describe('isIgnoredStoragePath', () => {
  it.each([
    ['service/drive/file.json', false],
    ['service/drive/nested/deep/file.bin', false],
    ['service/drive/file.ext.qpqmeta.json', false],
    ['service/drive/tmp-report.pdf', false],
    ['', false],
    ['service/drive/.hidden', true],
    ['service/.git/HEAD', true],
    ['service/drive/node_modules/pkg/index.js', true],
    ['service/drive/store.json.123.456.tmp', true],
    ['service\\drive\\.hidden', true],
    ['service\\drive\\store.tmp', true],
  ])('%j is ignored: %s', (relativePath: string, ignored: boolean) => {
    expect(isIgnoredStoragePath(relativePath)).toBe(ignored);
  });
});
