import { describe, expect, it } from 'vitest';

import { parseMounts } from './parseMounts';

describe('parseMounts', () => {
  it('parses pairs, trimming spaces, empties and trailing slashes', () => {
    expect(parseMounts(' /mnt/user/media/downloads/:/mnt/user/media/downloads ,, /mnt/user/tv:/tv:ro ')).toEqual([
      { host: '/mnt/user/media/downloads', container: '/mnt/user/media/downloads', readOnly: false },
      { host: '/mnt/user/tv', container: '/tv', readOnly: true },
    ]);
  });

  it('accepts an explicit :rw and spaces inside paths', () => {
    expect(parseMounts('/mnt/user/my media:/media:rw')).toEqual([{ host: '/mnt/user/my media', container: '/media', readOnly: false }]);
  });

  it('rejects a malformed mount', () => {
    expect(() => parseMounts('relative:/media')).toThrow("Mount 'relative:/media' must be host:container");
    expect(() => parseMounts('/mnt/user/media')).toThrow("Mount '/mnt/user/media' must be host:container");
    expect(() => parseMounts('/a:/b:rx')).toThrow("Mount '/a:/b:rx' must be host:container");
  });

  it('rejects a mount over the image', () => {
    expect(() => parseMounts('/mnt/user/x:/app')).toThrow("would cover the image's own files");
    expect(() => parseMounts('/mnt/user/x:/app/.qpq-runtime')).toThrow("would cover the image's own files");
    expect(() => parseMounts('/mnt/user/x:/')).toThrow("would cover the image's own files");
  });
});
