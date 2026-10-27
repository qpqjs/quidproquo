import { describe, expect, it } from 'vitest';

import { getArgValue, hasArgFlag, getPositionalArgs } from './args';

describe('hasArgFlag', () => {
  it('is false when the flag is absent', () => {
    expect(hasArgFlag(['--app', 'qpqjs'], '--keep-other-dev-servers')).toBe(false);
  });

  it('is true when the flag is present on its own', () => {
    expect(hasArgFlag(['--app', 'qpqjs', '--keep-other-dev-servers'], '--keep-other-dev-servers')).toBe(true);
  });

  it('honours an explicit value, so a wrapper can pass a computed one', () => {
    expect(hasArgFlag(['--keep-other-dev-servers=true'], '--keep-other-dev-servers')).toBe(true);
    expect(hasArgFlag(['--keep-other-dev-servers=false'], '--keep-other-dev-servers')).toBe(false);
  });

  it('does not match a different flag that shares a prefix', () => {
    expect(hasArgFlag(['--keep-other-dev-servers-please'], '--keep-other-dev-servers')).toBe(false);
  });
});

describe('getArgValue', () => {
  it('reads a space-separated value', () => {
    expect(getArgValue(['--app', 'qpqjs'], '--app')).toBe('qpqjs');
  });

  it('reads an equals-separated value', () => {
    expect(getArgValue(['--app=qpqjs'], '--app')).toBe('qpqjs');
  });

  it('is undefined when absent', () => {
    expect(getArgValue(['--env', 'development'], '--app')).toBeUndefined();
  });
});

describe('getPositionalArgs', () => {
  it('skips flags and the values they consume', () => {
    expect(getPositionalArgs(['all', '--app', 'qpqjs', 'inf'], ['--app'])).toEqual(['all', 'inf']);
  });

  it('keeps a positional that follows a valueless flag', () => {
    // The new presence-only flag must not swallow the argument after it.
    expect(getPositionalArgs(['--keep-other-dev-servers', 'all'], ['--app'])).toEqual(['all']);
  });
});
