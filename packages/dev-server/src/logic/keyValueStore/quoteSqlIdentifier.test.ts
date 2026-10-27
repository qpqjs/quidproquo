import { describe, expect, it } from 'vitest';

import { quoteSqlIdentifier } from './quoteSqlIdentifier';

// Security regression: a store or index name is always one double-quoted identifier, so a name carrying quotes,
// semicolons or SQL keywords can never end the identifier or start a statement, and hyphen and underscore names never
// collapse onto the same table.
describe('quoteSqlIdentifier', () => {
  it('wraps the name in double quotes and doubles embedded quotes', () => {
    expect(quoteSqlIdentifier('users')).toBe('"users"');
    expect(quoteSqlIdentifier('us"ers')).toBe('"us""ers"');
  });

  it('keeps injection-shaped names inside one identifier', () => {
    const quoted = quoteSqlIdentifier('x"; DROP TABLE users; --');

    expect(quoted).toBe('"x""; DROP TABLE users; --"');
    expect(quoted.slice(1, -1).replace(/""/g, '')).not.toContain('"');
  });

  it('never maps hyphens and underscores onto the same identifier', () => {
    expect(quoteSqlIdentifier('user-sessions')).not.toBe(quoteSqlIdentifier('user_sessions'));
  });
});
