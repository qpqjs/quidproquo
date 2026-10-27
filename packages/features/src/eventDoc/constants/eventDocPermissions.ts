import { toQpqPermission } from '../../permission/logic/toQpqPermission';
import { QpqPermission } from '../../permission/types/QpqPermission';
import { EventDocPermissionAction } from '../types/EventDocPermissionAction';
import { EventDocPermissions } from '../types/EventDocPermissions';

const EVENT_DOC_PERMISSION_PREFIX = 'eventDoc';

/** The permission key one route of a collection checks. The `eventDoc:` prefix keeps the family out of app vocabulary. */
export const eventDocPermission = (storeName: string, action: EventDocPermissionAction): QpqPermission =>
  toQpqPermission(`${EVENT_DOC_PERMISSION_PREFIX}:${storeName}:${action}`);

/** A collection's full key set, for bundling into roles: `eventDocPermissions('templates').write` is `eventDoc:templates:write`. */
export const eventDocPermissions = (storeName: string): EventDocPermissions => ({
  [EventDocPermissionAction.read]: eventDocPermission(storeName, EventDocPermissionAction.read),
  [EventDocPermissionAction.create]: eventDocPermission(storeName, EventDocPermissionAction.create),
  [EventDocPermissionAction.write]: eventDocPermission(storeName, EventDocPermissionAction.write),
  [EventDocPermissionAction.delete]: eventDocPermission(storeName, EventDocPermissionAction.delete),
});
