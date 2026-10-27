import { describe, expect, it } from 'vitest';

import { getExtensionForMimeType, getMimeTypeFromContentType } from './mimeTypes';

describe('getExtensionForMimeType', () => {
  it('returns the extension for a known mime type', () => {
    expect(getExtensionForMimeType('application/json')).toBe('json');
    expect(getExtensionForMimeType('image/png')).toBe('png');
    expect(getExtensionForMimeType('text/csv')).toBe('csv');
  });

  it('matches case-insensitively', () => {
    expect(getExtensionForMimeType('IMAGE/JPEG')).toBe('jpg');
  });

  it('falls back to bin for an unknown mime type', () => {
    expect(getExtensionForMimeType('application/unknown')).toBe('bin');
  });

  it('falls back to bin for prototype-chain property names', () => {
    expect(getExtensionForMimeType('constructor')).toBe('bin');
    expect(getExtensionForMimeType('__proto__')).toBe('bin');
    expect(getExtensionForMimeType('hasOwnProperty')).toBe('bin');
    expect(getExtensionForMimeType('toString')).toBe('bin');
  });
});

describe('getMimeTypeFromContentType', () => {
  it('strips parameters off a content-type header', () => {
    expect(getMimeTypeFromContentType('text/plain; charset=utf-8')).toBe('text/plain');
  });

  it('returns the value unchanged when there are no parameters', () => {
    expect(getMimeTypeFromContentType('application/json')).toBe('application/json');
  });

  it('trims surrounding whitespace', () => {
    expect(getMimeTypeFromContentType('  image/png  ; foo=bar')).toBe('image/png');
  });
});
