// Shared shape of Neptune node and relationship results; both variants extend it.
export type NeptuneGraphEntity = {
  '~id': string;
  '~properties': Record<string, unknown>;
};
