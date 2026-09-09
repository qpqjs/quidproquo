/** Reserved effects handled by the base reducer. INIT_STATE opens every log at id 0; domain effects are declared per module. */
export enum EventDocEffect {
  InitState = 'INIT_STATE',
  SetCode = 'SET_CODE',
  SetName = 'SET_NAME',
  CreateDraft = 'CREATE_DRAFT',
  Publish = 'PUBLISH',

  // Soft delete lives in the log so every projection derives it.
  Delete = 'DELETE',
  Restore = 'RESTORE',
}
