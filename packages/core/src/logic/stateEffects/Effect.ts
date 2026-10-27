export type Effect<TType extends string, TPayload = undefined> = {
  type: TType;
  payload: TPayload;
};
