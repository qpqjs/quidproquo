/** One server-authored event for askEventDocAppendServerEvents; the append mints ids and stamps actor and clock. */
export type EventDocServerEventInput<T = unknown> = {
  type: string;
  data: T;
  version: number;
};
