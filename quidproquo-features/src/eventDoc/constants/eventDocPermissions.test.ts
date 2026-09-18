import { describe, expect, it } from 'vitest';

import { EventDocPermissionAction } from '../types/EventDocPermissionAction';
import { EventDocRouteName } from '../types/EventDocRouteName';
import { eventDocPermission, eventDocPermissions } from './eventDocPermissions';
import { eventDocRouteAction } from './eventDocRouteAction';

describe('eventDocPermissions', () => {
  it('namespaces every key under eventDoc:<store>', () => {
    expect(eventDocPermissions('templates')).toEqual({
      read: 'eventDoc:templates:read',
      create: 'eventDoc:templates:create',
      write: 'eventDoc:templates:write',
      delete: 'eventDoc:templates:delete',
    });
  });

  it('derives a route key from the same function the catalog uses', () => {
    const route: EventDocRouteName = 'appendEvent';
    expect(eventDocPermission('templates', eventDocRouteAction[route])).toBe(eventDocPermissions('templates').write);
  });

  it('maps reads to read, mutations to create/write/delete', () => {
    const byAction = (action: EventDocPermissionAction) =>
      (Object.keys(eventDocRouteAction) as EventDocRouteName[]).filter((name) => eventDocRouteAction[name] === action).sort();

    expect(byAction(EventDocPermissionAction.read)).toEqual(['get', 'getAsset', 'list', 'listAssets', 'listEvents', 'references', 'render']);
    expect(byAction(EventDocPermissionAction.create)).toEqual(['create']);
    expect(byAction(EventDocPermissionAction.write)).toEqual(['appendEvent', 'createAsset']);
    expect(byAction(EventDocPermissionAction.delete)).toEqual(['remove']);
  });
});
