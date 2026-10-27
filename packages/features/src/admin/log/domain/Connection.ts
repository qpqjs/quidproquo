export interface Connection {
  id: string;
  requestTime: string;
  requestTimeEpoch: number;
  ip: string;

  userId?: string;
  accessToken?: string;
}
