/** INIT_STATE payload, seeded by the backend at create. `id` is the modelId. */
export type EventDocInitData = {
  id: string;
  code: string;
  name: string;
};
