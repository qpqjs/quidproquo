import { describe, expect, it } from 'vitest';

import { convertQpqQueryToNeptune } from './convertQpqQueryToNeptune';

describe('convertQpqQueryToNeptune', () => {
  it('rewrites qpqElementId(n) to the neptune ~id accessor', () => {
    expect(convertQpqQueryToNeptune('RETURN qpqElementId(n)')).toBe('RETURN n.`~id`');
  });

  it('rewrites every occurrence in the query', () => {
    expect(convertQpqQueryToNeptune('qpqElementId(a), qpqElementId(b)')).toBe('a.`~id`, b.`~id`');
  });

  it('leaves a query without the helper untouched', () => {
    expect(convertQpqQueryToNeptune('MATCH (n) RETURN n')).toBe('MATCH (n) RETURN n');
  });
});
