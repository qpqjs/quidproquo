import { describe, expect, it } from 'vitest';

import { getArgValue } from './getArgValue';

describe('getArgValue', () => {
  it.each([
    [['--language', 'typescript'], '--language', 'typescript'],
    [['--language=typescript'], '--language', 'typescript'],
    [['app', '--domain', 'a.example.com', '--no-git'], '--domain', 'a.example.com'],
    [['app'], '--domain', undefined],
    [['--domain'], '--domain', undefined],
  ])('parses %j for %s as %s', (argv, flag, expected) => {
    expect(getArgValue(argv, flag)).toBe(expected);
  });
});
