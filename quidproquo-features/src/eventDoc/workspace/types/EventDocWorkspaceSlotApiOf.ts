/** Recovers a slot's concrete api type from its config. */
export type EventDocWorkspaceSlotApiOf<TSlot> = TSlot extends { api: infer TApi } ? TApi : never;
