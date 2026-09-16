import { describe, expect, it } from 'vitest';

import { expandJsonRedactions } from './expandJsonRedactions';

describe('expandJsonRedactions', () => {
  it('keeps the raw value and adds every string inside parsed json objects and arrays', () => {
    const blob = '{"user":"joe","pass":"pw-1","nested":{"k":"v"},"list":[{"t":"tok"},7]}';

    expect(expandJsonRedactions([blob])).toEqual([blob, 'joe', 'pw-1', 'v', 'tok']);
  });

  it('expands json strings nested inside json', () => {
    const inner = '{"a":"deep"}';
    const outer = JSON.stringify({ inner });

    expect(expandJsonRedactions([outer])).toEqual([outer, inner, 'deep']);
  });

  it('passes plain and unparseable values through unchanged', () => {
    expect(expandJsonRedactions(['plain', '{not json', '123', '"str"'])).toEqual(['plain', '{not json', '123', '"str"']);
  });
});
