import type { EventDocEventActor } from '../eventDoc';
import { AI_SYSTEM_USER_ID } from './AI_SYSTEM_USER_ID';

// The eventDoc actor stamped on events an AI assistant authors server-side.
export const AI_SYSTEM_ACTOR: EventDocEventActor = {
  userId: AI_SYSTEM_USER_ID,
  userDisplayName: 'AI Assistant',
};
