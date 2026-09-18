import { EventDocPermissionAction } from '../types/EventDocPermissionAction';
import { EventDocRouteName } from '../types/EventDocRouteName';

/**
 * The action each collection route requires. Exhaustive over EventDocRouteName, so a new route
 * cannot be mounted without deciding what it needs. Publish is an event through appendEvent,
 * so draft-vs-publish is not distinguishable here; a collection's validator draws that line.
 */
export const eventDocRouteAction: Record<EventDocRouteName, EventDocPermissionAction> = {
  list: EventDocPermissionAction.read,
  get: EventDocPermissionAction.read,
  listEvents: EventDocPermissionAction.read,
  render: EventDocPermissionAction.read,
  references: EventDocPermissionAction.read,
  listAssets: EventDocPermissionAction.read,
  getAsset: EventDocPermissionAction.read,
  create: EventDocPermissionAction.create,
  appendEvent: EventDocPermissionAction.write,
  createAsset: EventDocPermissionAction.write,
  remove: EventDocPermissionAction.delete,
};
