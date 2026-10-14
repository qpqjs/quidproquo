import { describe, expect, it } from 'vitest';

import { getPositionalArgs } from './args';
import { resolveGoDockerMode } from './goDockerMode';

describe('resolveGoDockerMode', () => {
  it('is full with neither flag', () => {
    expect(resolveGoDockerMode(['all', 'all', '--app', 'qpqjs'])).toBe('full');
  });

  it('is build-only with --build-only', () => {
    expect(resolveGoDockerMode(['all', 'all', '--build-only'])).toBe('build-only');
  });

  it('is from-build with --from-build', () => {
    expect(resolveGoDockerMode(['shell', 'api', '--from-build'])).toBe('from-build');
  });

  it('honours an explicit false, so a wrapper can pass a computed value', () => {
    expect(resolveGoDockerMode(['all', 'all', '--build-only=false'])).toBe('full');
  });

  it('refuses both flags at once', () => {
    expect(() => resolveGoDockerMode(['all', 'all', '--build-only', '--from-build'])).toThrow('exclusive');
  });

  it('leaves the positional plan untouched', () => {
    expect(getPositionalArgs(['all', 'all', '--build-only', '--app', 'qpqjs'], ['--app', '--deployment'])).toEqual(['all', 'all']);
  });
});
