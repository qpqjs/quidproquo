import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { adminUserContext } from './adminUserContext';
import { askAdminUserProvide } from './askAdminUserProvide';
import { askAdminUserRead } from './askAdminUserRead';

describe('askAdminUserRead', () => {
  it('round-trips the provided admin user under the qpq key', () => {
    expect(adminUserContext.uniqueName).toBe('qpq-admin-user');
    expect(runStory(askAdminUserProvide({ username: 'joe' }, askAdminUserRead()))).toEqual({ username: 'joe' });
  });
});
