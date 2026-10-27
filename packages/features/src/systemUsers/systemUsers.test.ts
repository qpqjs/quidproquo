import { describe, expect, it } from 'vitest';

import { AI_SYSTEM_ACTOR } from './AI_SYSTEM_ACTOR';
import { AI_SYSTEM_USER_ID } from './AI_SYSTEM_USER_ID';

// Security regression: the system actor is a fixed label that can never collide with a directory user, whose ids are
// Cognito subs (uuids). A change that made it uuid-shaped, or made the actor carry anything but the id and a display
// name, would let it be confused with or forged as a real principal.
describe('systemUsers', () => {
  it('uses a reserved id that no directory user can hold', () => {
    expect(AI_SYSTEM_USER_ID).toBe('system-ai');
    expect(AI_SYSTEM_USER_ID).not.toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('is an audit label only: an id and a display name, nothing that grants authority', () => {
    expect(Object.keys(AI_SYSTEM_ACTOR).sort()).toEqual(['userDisplayName', 'userId']);
    expect(AI_SYSTEM_ACTOR.userId).toBe(AI_SYSTEM_USER_ID);
  });
});
