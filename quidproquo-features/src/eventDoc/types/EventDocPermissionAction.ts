/** The authority a collection route needs; every eventDoc route maps to exactly one (see eventDocRouteAction). */
export enum EventDocPermissionAction {
  read = 'read',
  create = 'create',
  write = 'write',
  delete = 'delete',
}
