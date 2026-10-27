import { EventDocEventActor } from 'quidproquo-features';

// Placeholder until the server ack replaces the event with the real actor
// resolved from the access token.
export const localSessionEventActor: EventDocEventActor = {
  userId: 'local',
  userDisplayName: 'local',
};
