export interface Connection {
  id: string;
  requestTime: string;
  requestTimeEpoch: number;
  ip: string;

  userId?: string;
  accessToken?: string;

  // Validated storage scope (e.g. active tenant) claimed at authenticate time.
  // Every message on this connection runs with it as the ambient storage scope.
  scope?: string;
}
