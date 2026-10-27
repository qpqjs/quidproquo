import { describe, expect, it } from 'vitest';

import { isQpqPermission } from './isQpqPermission';
import { toQpqPermission } from './toQpqPermission';

describe('toQpqPermission', () => {
  it('accepts colon-separated segments', () => {
    expect(toQpqPermission('case:approve')).toBe('case:approve');
    expect(toQpqPermission('eventDoc:templates:write')).toBe('eventDoc:templates:write');
    expect(isQpqPermission('tenant:members:manage')).toBe(true);
  });

  it('rejects a single segment, empty segments and stray characters', () => {
    for (const bad of ['approve', 'case:', ':approve', 'case::approve', 'case approve', 'case:approve!', '']) {
      expect(isQpqPermission(bad)).toBe(false);
      expect(() => toQpqPermission(bad)).toThrow(/Invalid permission key/);
    }
  });
});
