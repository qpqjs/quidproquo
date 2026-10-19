/** One connection's interest in one scoped topic; the unit the subscriptions store holds. */
export type Subscription = {
  topic: string;
  connectionId: string;
};
