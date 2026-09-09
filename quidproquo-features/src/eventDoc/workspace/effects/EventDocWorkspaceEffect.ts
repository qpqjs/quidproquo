/** Workspace effect types. */
export enum EventDocWorkspaceEffect {
  ApplyEvent = '@quidproquo-features/eventDocWorkspace/applyEvent',
  ApplyTransientEvent = '@quidproquo-features/eventDocWorkspace/applyTransientEvent',
  DropTransient = '@quidproquo-features/eventDocWorkspace/dropTransient',
  SetHistoryEvents = '@quidproquo-features/eventDocWorkspace/setHistoryEvents',
  SetFullHistory = '@quidproquo-features/eventDocWorkspace/setFullHistory',
  AppendFullHistory = '@quidproquo-features/eventDocWorkspace/appendFullHistory',
  AppendHistoryEvent = '@quidproquo-features/eventDocWorkspace/appendHistoryEvent',
  AppendHistoryEvents = '@quidproquo-features/eventDocWorkspace/appendHistoryEvents',
  SetPendingEvents = '@quidproquo-features/eventDocWorkspace/setPendingEvents',
  RemovePendingEvent = '@quidproquo-features/eventDocWorkspace/removePendingEvent',
  SetDocumentIdentity = '@quidproquo-features/eventDocWorkspace/setDocumentIdentity',
  SetLoading = '@quidproquo-features/eventDocWorkspace/setLoading',
  SetSaving = '@quidproquo-features/eventDocWorkspace/setSaving',
  SetError = '@quidproquo-features/eventDocWorkspace/setError',
  ClearError = '@quidproquo-features/eventDocWorkspace/clearError',
  Reset = '@quidproquo-features/eventDocWorkspace/reset',
}
