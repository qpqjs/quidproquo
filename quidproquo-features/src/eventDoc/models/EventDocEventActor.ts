/** Who produced an event, captured server-side at append time. `userDisplayName` is the name as it was then, for display only. */
export type EventDocEventActor = {
  userId: string;
  userDisplayName: string;
};
