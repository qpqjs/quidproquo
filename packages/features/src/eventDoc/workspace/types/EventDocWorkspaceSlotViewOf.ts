/** Recovers a slot's concrete view type from its config. */
export type EventDocWorkspaceSlotViewOf<TSlot> = TSlot extends { createInitialViewState: () => infer TView } ? TView : never;
