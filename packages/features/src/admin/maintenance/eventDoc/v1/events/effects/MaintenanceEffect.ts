// The maintenance doc's own events. An UPDATE is the atomic mutation — a full
// status snapshot (banner/reason/level/type/services + admin-only note); the
// doc's current state derives from the surviving update list, last update
// winning. The reserved lifecycle effects (INIT_STATE / CREATE_DRAFT / PUBLISH)
// are deliberately NOT members — they merge in via the base reducer.
export enum MaintenanceEffect {
  AddUpdate = 'ADD_UPDATE',
  EditUpdate = 'EDIT_UPDATE',
  RemoveUpdate = 'REMOVE_UPDATE',
}
