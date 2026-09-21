import { describe, expect, it } from 'vitest';

import { InvalidScopeError } from './InvalidScopeError';
import { splitScopedFilePath } from './splitScopedFilePath';

describe('splitScopedFilePath', () => {
  it('takes the first segment as the scope', () => {
    expect(splitScopedFilePath('TENANT#a/docs/x.pdf')).toEqual({ scope: 'TENANT#a', filepath: 'docs/x.pdf' });
  });

  it('round-trips a composed path', () => {
    expect(splitScopedFilePath('PERSONAL#u1/a.txt')).toEqual({ scope: 'PERSONAL#u1', filepath: 'a.txt' });
  });

  it('throws for a path with no scope segment', () => {
    expect(() => splitScopedFilePath('stray.pdf')).toThrow(InvalidScopeError);
    expect(() => splitScopedFilePath('/stray.pdf')).toThrow(InvalidScopeError);
    expect(() => splitScopedFilePath('TENANT#a/')).toThrow(InvalidScopeError);
  });

  it('throws for a malformed scope segment', () => {
    expect(() => splitScopedFilePath('../x.pdf')).toThrow(InvalidScopeError);
  });
});
