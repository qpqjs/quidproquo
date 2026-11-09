import type { EventDocEventActor } from '../eventDoc';
import { REPORT_SYSTEM_USER_ID } from './reportSystemUserId';

// The eventDoc actor stamped on the month documents the reports consumer creates and appends to.
export const REPORT_SYSTEM_ACTOR: EventDocEventActor = {
  userId: REPORT_SYSTEM_USER_ID,
  userDisplayName: 'Reports',
};
