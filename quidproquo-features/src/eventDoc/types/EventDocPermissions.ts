import { QpqPermissionGroup } from '../../permission/types/QpqPermissionGroup';
import { EventDocPermissionAction } from './EventDocPermissionAction';

/** One collection's permission keys, keyed by action (`eventDoc:<store>:<action>`); see eventDocPermissions. */
export type EventDocPermissions = QpqPermissionGroup<EventDocPermissionAction>;
