import { describe, expect, it } from 'vitest';

import { getPositionalArgs } from './getPositionalArgs';

describe('getPositionalArgs', () => {
  it('keeps non-flag args and drops flags', () => {
    expect(getPositionalArgs(['my-app', '--no-git'], [])).toEqual(['my-app']);
  });

  it('skips the value consumed by a known value flag', () => {
    expect(getPositionalArgs(['--language', 'typescript', 'my-app'], ['--language'])).toEqual(['my-app']);
  });

  it('keeps the token after a boolean flag', () => {
    expect(getPositionalArgs(['--no-git', 'my-app'], ['--language'])).toEqual(['my-app']);
  });

  it('treats --flag=value as a single flag token', () => {
    expect(getPositionalArgs(['--language=typescript', 'my-app'], ['--language'])).toEqual(['my-app']);
  });
});
